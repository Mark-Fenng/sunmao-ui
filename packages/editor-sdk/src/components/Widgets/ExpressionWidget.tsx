import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import {
  toNumber,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isObject,
  isUndefined,
  isNull,
  debounce,
} from 'lodash-es';
import { Type, Static } from '@sinclair/typebox';
import { WidgetProps } from '../../types/widget';
import { implementWidget } from '../../utils/widget';
import { ExpressionEditor, ExpressionEditorHandle } from '../Form';
import { isExpression } from '../../utils/validator';
import { getTypeString } from '../../utils/type';
import Ajv, { EnumParams } from 'ajv';
import { ExpressionError } from '@sunmao-ui/runtime';
import { CORE_VERSION, CoreWidgetName } from '@sunmao-ui/shared';

// FIXME: move into a new package and share with runtime?
export function isNumeric(x: string | number) {
  return !isNaN(Number(x)) && x !== '';
}

// highly inspired by appsmith
export enum Types {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  OBJECT = 'OBJECT',
  ARRAY = 'ARRAY',
  FUNCTION = 'FUNCTION',
  UNDEFINED = 'UNDEFINED',
  NULL = 'NULL',
  UNKNOWN = 'UNKNOWN',
}

export const getType = (value: unknown) => {
  if (isString(value)) return Types.STRING;
  if (isNumber(value)) return Types.NUMBER;
  if (isBoolean(value)) return Types.BOOLEAN;
  if (Array.isArray(value)) return Types.ARRAY;
  if (isFunction(value)) return Types.FUNCTION;
  if (isObject(value)) return Types.OBJECT;
  if (isUndefined(value)) return Types.UNDEFINED;
  if (isNull(value)) return Types.NULL;
  return Types.UNKNOWN;
};

function generateTypeDef(
  obj: any
): string | Record<string, string | Record<string, unknown>> {
  const type = getType(obj);
  switch (type) {
    case Types.ARRAY: {
      const arrayType = getType(obj[0]);
      return `[${arrayType}]`;
    }
    case Types.OBJECT: {
      const objType: Record<string, string | Record<string, unknown>> = {};
      Object.keys(obj).forEach(k => {
        objType[k] = generateTypeDef(obj[k]);
      });
      return objType;
    }
    case Types.STRING:
      return 'string';
    case Types.NUMBER:
      return 'number';
    case Types.BOOLEAN:
      return 'bool';
    case Types.NULL:
    case Types.UNDEFINED:
      return '?';
    default:
      return '?';
  }
}

let extraDefs: any = {};

const customTreeTypeDefCreator = (dataTree: Record<string, Record<string, unknown>>) => {
  const def: any = {
    '!name': 'customDataTree',
  };
  Object.keys(dataTree).forEach(entityName => {
    const entity = dataTree[entityName];
    def[entityName] = generateTypeDef(entity);
  });
  def['!define'] = { ...extraDefs };
  extraDefs = {};
  return { ...def };
};

const getCode = (value: unknown): { code: string; type: string } => {
  const type = typeof value;
  if (type === 'object' || type === 'boolean') {
    value = JSON.stringify(value, null, 2);
  } else if (value === undefined) {
    value = '';
  } else {
    value = String(value);
  }
  return {
    code: value as string,
    type,
  };
};

const getParsedValue = (raw: string, type: string) => {
  if (isExpression(raw)) {
    return raw;
  }
  if (type === 'object' || type === 'boolean') {
    try {
      return JSON.parse(raw);
    } catch (error) {
      // TODO: handle error
      return {};
    }
  }
  if (type === 'number') {
    return toNumber(raw);
  }
  return raw;
};

export const ExpressionWidgetOptionsSpec = Type.Object({
  compactOptions: Type.Optional(
    Type.Object({
      height: Type.Optional(Type.String()),
      paddingY: Type.Optional(Type.String()),
    })
  ),
});

const ajv = new Ajv();

export const ExpressionWidget: React.FC<
  WidgetProps<Static<typeof ExpressionWidgetOptionsSpec>>
> = props => {
  const { value, services, spec, onChange } = props;
  const { widgetOptions } = spec;
  const { stateManager } = services;
  const { code, type } = useMemo(() => {
    return getCode(value);
  }, [value]);
  const [defs, setDefs] = useState<any>();
  const [evaledValue, setEvaledValue] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<ExpressionEditorHandle>(null);
  const validate = useMemo(() => ajv.compile(spec), [spec]);
  const evalCode = useCallback(
    (code: string) => {
      try {
        const value = getParsedValue(code, type);
        const result = isExpression(code) ? services.stateManager.maskedEval(value) : value;

        if (result instanceof ExpressionError) {
          throw result;
        }

        validate(result);

        if (validate.errors?.length) {
          const err = validate.errors[0];

          if (err.keyword === 'type') {
            throw new TypeError(
              `Invalid value, expected ${spec.type} but got ${getTypeString(
                result
              ).toLowerCase()}`
            );
          } else if (err.keyword === 'enum') {
            throw new TypeError(`${err.message}: ${JSON.stringify((err.params as EnumParams).allowedValues)}`);
          } else {
            throw new TypeError(err.message);
          }
        }

        setEvaledValue(result);
        setError(null);
      } catch (err) {
        setError(String(err));
      }
    },
    [services, type, validate, spec]
  );
  const onCodeChange = useMemo(() => debounce(evalCode, 300), [evalCode]);
  const onFocus = useCallback(() => {
    evalCode(code);
  }, [code, evalCode]);
  const onBlur = useCallback(
    newCode => {
      const newValue = getParsedValue(newCode, type);

      onChange(newValue);
    },
    [type, onChange]
  );

  useEffect(() => {
    setDefs([customTreeTypeDefCreator(stateManager.store)]);
  }, [stateManager]);
  useEffect(() => {
    editorRef.current?.setCode(code);
  }, [code]);

  return (
    <ExpressionEditor
      compactOptions={{
        maxHeight: '125px',
        ...(widgetOptions?.compactOptions || {}),
      }}
      ref={editorRef}
      defaultCode={code}
      evaledValue={evaledValue}
      error={error}
      defs={defs}
      onChange={onCodeChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  );
};

export default implementWidget<Static<typeof ExpressionWidgetOptionsSpec>>({
  version: CORE_VERSION,
  metadata: {
    name: CoreWidgetName.Expression,
  },
  spec: {
    options: ExpressionWidgetOptionsSpec,
  },
})(ExpressionWidget);
