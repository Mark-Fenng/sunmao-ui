/* eslint-disable @typescript-eslint/ban-types */
import {
  Button,
  Link,
  Input,
  Table as BaseTable,
  PaginationProps,
} from '@arco-design/web-react';
import { css } from '@emotion/css';
import { Type, Static } from '@sinclair/typebox';
import { FALLBACK_METADATA, getComponentProps } from '../sunmao-helper';
import { TablePropsSpec, ColumnSpec } from '../generated/types/Table';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { sortBy } from 'lodash-es';
import {
  LIST_ITEM_EXP,
  LIST_ITEM_INDEX_EXP,
  ModuleRenderer,
  implementRuntimeComponent,
} from '@sunmao-ui/runtime';
import { TableInstance } from '@arco-design/web-react/es/Table/table';

const TableStateSpec = Type.Object({
  clickedRow: Type.Optional(Type.Any()),
  selectedRows: Type.Array(Type.Any()),
  selectedRow: Type.Optional(Type.Any()),
  selectedRowKeys: Type.Array(Type.String()),
});

type SortRule = {
  field: string;
  direction?: 'ascend' | 'descend';
};

type ColumnProperty = Static<typeof ColumnSpec> & {
  filterDropdown?: ({
    filterKeys,
    setFilterKeys,
    confirm,
  }: filterDropdownParam) => ReactNode;
  render?: (ceilValue: any, record: any, index: number) => ReactNode;
};

type filterDropdownParam = {
  filterKeys?: string[];
  setFilterKeys?: (filterKeys: string[], callback?: Function) => void;
  confirm?: Function;
};

const rowSelectionTypeMap: Record<string, 'checkbox' | 'radio' | undefined> = {
  multiple: 'checkbox',
  single: 'radio',
  disable: undefined,
};

const rowClickStyle = css`
  cursor: pointer;
  & tr.selected td {
    background-color: rgb(235, 244, 251);
  }
  & tr.selected:hover > td {
    background-color: rgb(228, 236, 243) !important;
  }
`;

export const exampleProperties: Static<typeof TablePropsSpec> = {
  columns: [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      type: 'text',
      filter: true,
      displayValue: '',
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      sorter: true,
      filter: false,
      type: 'text',
      displayValue: '',
    },
    {
      title: 'Time',
      dataIndex: 'time',
      sorter: true,
      filter: false,
      type: 'text',
      displayValue: '',
    },
    {
      title: 'Link',
      dataIndex: 'link',
      type: 'link',
      filter: true,
      sorter: false,
      displayValue: '',
    },
    {
      title: 'CustomComponent',
      dataIndex: 'customComponent',
      type: 'module',
      filter: false,
      sorter: false,
      module: {
        id: 'clistItemName-{{$listItem.id}}',
        handlers: [],
        properties: [],
        type: 'core/v1/text',
      },
      displayValue: '',
    },
  ],
  data: Array(13)
    .fill('')
    .map((_, index) => ({
      key: `key ${index}`,
      name: `${Math.random() > 0.5 ? 'Kevin Sandra' : 'xzdry'}${index}`,
      link: `link${Math.random() > 0.5 ? '-A' : '-B'}`,
      salary: Math.floor(Math.random() * 1000),
      time: `2021-${Math.floor(Math.random() * 11)}-11T${Math.floor(
        Math.random() * 23
      )}:10:45.437Z`,
    })),
  pagination: {
    pageSize: 6,
  },
  rowClick: false,
  tableLayoutFixed: false,
  borderCell: false,
  stripe: false,
  size: 'default',
  pagePosition: 'bottomCenter',
  rowSelectionType: 'single',
  border: true,
  loading: false,
};

export const Table = implementRuntimeComponent({
  version: 'arco/v1',
  metadata: {
    ...FALLBACK_METADATA,
    exampleProperties,
    annotations: {
      category: 'Display',
    },
    name: 'table',
    displayName: 'Table',
  },
  spec: {
    properties: TablePropsSpec,
    state: TableStateSpec,
    methods: {},
    slots: [],
    styleSlots: ['content'],
    events: [],
  },
})(props => {
  const { getElement, app, mergeState, customStyle, services, data, component } = props;

  const ref = useRef<TableInstance | null>(null);
  const { pagination, rowClick, ...cProps } = getComponentProps(props);

  const rowSelectionType = rowSelectionTypeMap[cProps.rowSelectionType];

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortRule, setSortRule] = useState<SortRule>({
    field: 'name',
    direction: undefined,
  });
  const [filterRule, setFilterRule] = useState();

  const filteredData = useMemo(() => {
    let filteredData = Array.isArray(data) ? data : [];
    if (filterRule) {
      Object.keys(filterRule).forEach(colIdx => {
        const value = filterRule[colIdx][0];
        filteredData = filteredData?.filter(row =>
          value ? row[colIdx].indexOf(value) !== -1 : true
        );
      });
    }
    return filteredData;
  }, [data, filterRule]);

  const sortedData = useMemo(() => {
    if (!sortRule || !sortRule.direction) {
      return filteredData;
    }

    const sorted = sortBy(filteredData, sortRule.field);
    return sortRule.direction === 'ascend' ? sorted : sorted.reverse();
  }, [filteredData, sortRule]);

  const { pageSize } = pagination;
  const currentPageData = sortedData?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    mergeState({
      selectedRowKeys,
    });
  }, [selectedRowKeys, mergeState]);

  const inputRef = useRef(null);

  const columns = cProps.columns!.map((column, i) => {
    const newColumn: ColumnProperty = { ...column };
    if (newColumn.filter) {
      newColumn.filterDropdown = ({
        filterKeys,
        setFilterKeys,
        confirm,
      }: filterDropdownParam) => {
        return (
          <div className="arco-table-custom-filter">
            <Input.Search
              ref={inputRef}
              searchButton
              placeholder="Please input and enter"
              value={filterKeys?.[0] || ''}
              onChange={value => {
                setFilterKeys && setFilterKeys(value ? [value] : []);
              }}
              onSearch={() => {
                confirm && confirm();
              }}
            />
          </div>
        );
      };
    }

    newColumn.render = (ceilValue: any, record: any, index: number) => {
      const evalOptions = {
        evalListItem: true,
        scopeObject: {
          [LIST_ITEM_EXP]: record,
        },
      };
      const evaledColumn: ColumnProperty = services.stateManager.deepEval(
        column,
        evalOptions
      );
      const value = record[evaledColumn.dataIndex];

      let colItem;

      switch (evaledColumn.type) {
        case 'button':
          const handleClick = () => {
            const rawColumn = (component.properties.columns as ColumnProperty[])[i];
            if (!rawColumn.btnCfg) return;
            const evaledButtonConfig = services.stateManager.deepEval(
              rawColumn.btnCfg,
              evalOptions
            );

            evaledButtonConfig.handlers.forEach(handler => {
              services.apiService.send('uiMethod', {
                componentId: handler.componentId,
                name: handler.method.name,
                parameters: handler.method.parameters || {},
              });
            });
          };
          colItem = (
            <Button
              onClick={() => {
                handleClick();
              }}
            >
              {evaledColumn.btnCfg?.text}
            </Button>
          );
          break;
        case 'link':
          colItem = <Link href={value}>{evaledColumn.displayValue || value}</Link>;
          break;
        case 'module':
          const evalScope = {
            [LIST_ITEM_EXP]: record,
            [LIST_ITEM_INDEX_EXP]: index,
          };
          colItem = (
            <ModuleRenderer
              app={app}
              evalScope={evalScope}
              handlers={evaledColumn.module?.handlers || []}
              id={evaledColumn.module?.id || ''}
              properties={evaledColumn.module?.properties || {}}
              services={services}
              type={evaledColumn.module?.type || ''}
            />
          );
          break;
        default:
          colItem = <span>{evaledColumn.displayValue || value}</span>;
          break;
      }
      return colItem;
    };
    return newColumn;
  });

  const handleChange = (
    pagination: PaginationProps,
    sorter: { field?: string; direction?: 'descend' | 'ascend' },
    filter: any
  ) => {
    const { current } = pagination;
    if (current !== currentPage) {
      setCurrentPage(current!);
      return;
    }

    // TODO can be optimized
    setSortRule(sorter as SortRule);

    setFilterRule(filter);
  };

  useEffect(() => {
    const ele = ref.current?.getRootDomElement();
    if (ele && getElement) {
      getElement(ele);
    }
  }, [getElement, ref]);

  return (
    <BaseTable
      ref={ref}
      className={css`
        ${customStyle?.content}
        ${rowClick ? rowClickStyle : ''}
      `}
      {...cProps}
      columns={columns}
      pagination={{
        total: sortedData!.length,
        current: currentPage,
        pageSize,
        hideOnSinglePage: true,
      }}
      data={currentPageData}
      onChange={handleChange}
      rowSelection={{
        type: rowSelectionType,
        selectedRowKeys,
        onChange(selectedRowKeys) {
          setSelectedRowKeys(selectedRowKeys as string[]);
        },
        onSelect: (selected, record, selectedRows) => {
          selected && mergeState({ selectedRow: record });
          mergeState({ selectedRows });
        },
        onSelectAll(selected, selectedRows) {
          mergeState({ selectedRows });
        },
      }}
      onRow={
        rowClick
          ? record => {
              return {
                onClick(event: React.ChangeEvent<HTMLButtonElement>) {
                  const tr = event.target.closest('tr');
                  const tbody = tr?.parentNode;
                  if (tbody) {
                    const prevSelectedEl = tbody.querySelector('.selected');
                    prevSelectedEl?.classList.remove('selected');
                  }
                  tr?.classList.add('selected');
                  mergeState({ clickedRow: record });
                },
              };
            }
          : undefined
      }
    />
  );
});
