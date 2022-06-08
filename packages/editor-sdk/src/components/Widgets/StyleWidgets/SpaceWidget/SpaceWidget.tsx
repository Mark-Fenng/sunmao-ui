import React from 'react';
import { CORE_VERSION, StyleWidgetName } from '@sunmao-ui/shared';
import { WidgetProps } from '../../../../types/widget';
import { implementWidget } from '../../../../utils/widget';
import { SpacePanel } from './SpacePanel';
import { SpaceValue } from './type';
import { Grid } from '@chakra-ui/react';

const containerStyle = {
  mt: '8px',
  mr: '8px',
  width: '224px',
  height: '120px',
  gridTemplateColumns: '36px 4px 36px 1fr 36px 4px 36px',
  gridTemplateRows: '24px 4px 24px 1fr 24px 4px 24px',
  cursor: 'default',
};
const marginStyle = {
  gridArea: '1 / 1 / -1 / -1',
  gridTemplateColumns: '36px 1fr 36px',
  gridTemplateRows: '24px 1fr 24px',
};

const paddingStyle = {
  gridArea: '3 / 3 / span 3 / span 3',
  gridTemplateColumns: '36px 1fr 36px',
  gridTemplateRows: '24px 1fr 24px',
};

const marginConfig = {
  hasAuto: true,
  shortcuts: [0, 10, 20, 40, 60, 100, 140, 200],
};

const paddingConfig = {
  hasAuto: false,
  shortcuts: [0, 10, 20, 40, 60, 80, 120, 140, 160, 180],
};

const horizontalColor = 'rgb(247,248,250)';
const verticalColor = 'rgb(242,243,245)';
const marginPaths = [
  {
    id: 'top',
    d: 'm1,1 h223 l-36,24 h-151 l-36,-24z',
    cursor: 'n-resize',
    color: horizontalColor,
  },
  {
    id: 'right',
    d: 'm223,1 v119 l-36,-24 v-71 l36,-24z',
    cursor: 'e-resize',
    color: verticalColor,
  },
  {
    id: 'bottom',
    d: 'm1,119 h223 l-36,-24 h-151 l-36,24z',
    cursor: 's-resize',
    color: horizontalColor,
  },
  {
    id: 'left',
    d: 'm1,1 v119 l36,-24 v-71 l-36,-24z',
    cursor: 'w-resize',
    color: verticalColor,
  },
];

const paddingPaths = [
  {
    id: 'top',
    d: 'm1,1 h143 l-36,24 h-71 l-36,-24z',
    cursor: 'n-resize',
    color: horizontalColor,
  },
  {
    id: 'right',
    d: 'm143,1 v63 l-36,-24 v-15 l36,-24z',
    cursor: 'e-resize',
    color: verticalColor,
  },
  {
    id: 'bottom',
    d: 'm1,63 h143 l-36,-24 h-71 l-36,24z',
    cursor: 's-resize',
    color: horizontalColor,
  },
  {
    id: 'left',
    d: 'm1,1 v63 l36,-24 v-15 l-36,-24z',
    cursor: 'w-resize',
    color: verticalColor,
  },
];

const getSpaceValue = (v: number | string, type = '') => {
  const intValue = Number(v);
  return Number.isNaN(intValue)
    ? 0
    : type === 'padding'
    ? intValue > 0
      ? intValue
      : 0
    : intValue;
};

const arrayToSpaceValue = (values: SpaceValue[], type = '') => {
  return values.reduce((result, value) => {
    result += (value === 'Auto' ? 'auto' : `${getSpaceValue(value, type)}px`) + ' ';
    return result;
  }, '');
};

/**
 *
 * @param spaceValue
 * @returns
 * Convert space string to an array,e.g.
 * margin: 'auto 0px 10px 10px' ------> ['auto',0,10,10]
 */
const spaceValueToArray = (spaceValue: string) => {
  const values: SpaceValue[] = [0, 0, 0, 0];

  if (!spaceValue) return values;

  const reg = /(auto)|(-?\d+)px/g;
  let match = reg.exec(spaceValue);
  let i = 0;
  while (match) {
    const value = match[1] || match[2];
    if (value === 'auto') {
      values[i] = 'Auto';
    } else {
      values[i] = getSpaceValue(value);
    }
    match = reg.exec(spaceValue);
    i++;
  }
  return values;
};

type Space = {
  margin?: string | number;
  padding?: string | number;
};

export const SpaceWidget: React.FC<WidgetProps<{}, Space>> = props => {
  const { value, onChange } = props;

  const handleChange = (type: string, spaceValues: SpaceValue[]) => {
    const newValue = arrayToSpaceValue(spaceValues, type);
    onChange({
      ...value,
      [type]: newValue,
    });
  };
  const marginValues = spaceValueToArray(String(value.margin));
  const paddingValues = spaceValueToArray(String(value.padding));

  return (
    <>
      <Grid {...containerStyle}>
        <Grid {...marginStyle}>
          <SpacePanel
            text="MARGIN"
            type="margin"
            width="224px"
            height="120px"
            values={marginValues}
            onChange={(v: SpaceValue[]) => {
              handleChange('margin', v);
            }}
            spaceConfig={marginConfig}
            paths={marginPaths}
          />
        </Grid>
        <Grid {...paddingStyle}>
          <SpacePanel
            text="PADDING"
            width="144px"
            height="64px"
            values={paddingValues}
            type="padding"
            spaceConfig={paddingConfig}
            onChange={(v: SpaceValue[]) => {
              handleChange('padding', v);
            }}
            paths={paddingPaths}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default implementWidget({
  version: CORE_VERSION,
  metadata: {
    name: StyleWidgetName.Space,
  },
})(SpaceWidget);
