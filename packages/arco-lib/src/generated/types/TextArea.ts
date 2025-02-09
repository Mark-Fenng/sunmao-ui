import { Type } from '@sinclair/typebox';
import { StringUnion } from '../../sunmao-helper';
import { Category } from '../../constants/category';

export const TextAreaPropsSpec = {
  defaultValue: Type.String({
    title: 'Default Value',
    category: Category.Basic,
  }),
  updateWhenDefaultValueChanges: Type.Boolean({
    title: 'Update When Default Value Changes',
    category: Category.Basic,
  }),
  placeholder: Type.String({
    title: 'Placeholder',
    category: Category.Basic,
  }),
  autoSize: Type.Boolean({
    category: Category.Basic,
    title: 'Auto Size',
  }),
  disabled: Type.Boolean({
    title: 'Disabled',
    category: Category.Basic,
  }),
  size: StringUnion(['default', 'mini', 'small', 'large'], {
    title: 'Size',
    category: Category.Style,
  }),
  allowClear: Type.Boolean({
    title: 'Allow Clear',
    category: Category.Basic,
  }),
  error: Type.Boolean({
    title: 'Error',
    category: Category.Basic,
  }),
};
