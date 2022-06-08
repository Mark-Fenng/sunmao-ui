import React, { useCallback, useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import { SpaceEditPanel, SpaceConfig } from './SpaceEditPanel';
import { Path, SpaceValue } from './type';
import { Portal } from '@chakra-ui/react';

const containerStyle = css`
  grid-area: 1 / 1 / -1 / -1;
  & {
    color: #c10;
    path:hover {
      color: rgb(229, 230, 235);
    }
  }
`;

const titleStyle = css`
  grid-area: 1 / 1 / -1 / -1;
  pointer-events: none;
`;

const getMaskStyle = (cursor: string) => {
  return css`
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    cursor: ${cursor};
  `;
};

const getDirectionStyle = (direction: string) => {
  let gridArea;

  switch (direction) {
    case 'top':
      gridArea = '1 / 2 / 2 / 3';
      break;
    case 'right':
      gridArea = '2 / 3 / 3 / 4';
      break;
    case 'bottom':
      gridArea = '3 / 2 / 4 / 3';
      break;
    case 'left':
      gridArea = '2 / 1 / 3 / 2';
      break;
  }
  return cx(
    direction,
    css`
      cursor: default;
      user-select: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 10px;
      font-weight: 400;
      line-height: 10px;
      letter-spacing: -0.2px;
      display: flex;
      color: #000;
      background: transparent;
      padding: 2px;
      margin-left: -2px;
      border-radius: 2px;
      max-width: 100%;
      box-sizing: content-box;
      place-self: center;
      position: relative;
      opacity: 1;
      align-items: center;
      justify-content: center;
      grid-area: ${gridArea};
    `
  );
};

type SpacePanelProps = {
  paths: Path[];
  text: string;
  type: string;
  width?: string;
  height?: string;
  values: SpaceValue[];
  spaceConfig: SpaceConfig;
  onChange: (value: SpaceValue[]) => void;
};

export const SpacePanel: React.FC<SpacePanelProps> = ({
  paths,
  onChange,
  text,
  values,
  type,
  width,
  height,
  ...props
}) => {
  const [direction, setDirection] = useState('');

  // TODO Performance experience needs to be optimized
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (direction) {
        e.preventDefault();
        switch (direction) {
          case 'top':
            {
              const intValue = values[0] === 'Auto' ? 0 : values[0];
              values[0] = intValue - e.movementY;
            }
            break;
          case 'right':
            {
              const intValue = values[1] === 'Auto' ? 0 : values[1];
              values[1] = intValue + e.movementX;
            }
            break;
          case 'bottom':
            {
              const intValue = values[2] === 'Auto' ? 0 : values[2];
              values[2] = intValue + e.movementY;
            }
            break;
          case 'left':
            {
              const intValue = values[3] === 'Auto' ? 0 : values[3];
              values[3] = intValue - e.movementX;
            }
            break;
        }
        onChange(values);
      }
    },
    [direction, values, onChange]
  );
  const handleMouseUp = () => {
    setDirection('');
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <>
      <svg
        className={containerStyle}
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map(path => {
          return (
            <g key={path.id}>
              <path
                aria-label={`${type} ${path.id} button`}
                onMouseDown={(e: React.MouseEvent<SVGPathElement>) => {
                  if (e.button === 0) {
                    setDirection(path.id);
                  }
                }}
                fill="currentColor"
                {...path}
              />
              <Portal>
                {direction === path.id ? (
                  <div className={getMaskStyle(path.cursor!)} />
                ) : null}
              </Portal>
            </g>
          );
        })}
      </svg>
      {paths.map((path, idx) => {
        return (
          <SpaceEditPanel
            key={path.id}
            value={values[idx]}
            onChange={v => {
              values[idx] = v;
              onChange(values);
            }}
            {...props}
          >
            <div className={getDirectionStyle(path.id)}>{values[idx]}</div>
          </SpaceEditPanel>
        );
      })}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        className={titleStyle}
      >
        <text
          x="6"
          y="4"
          fill="#ababab"
          fontStyle="italic"
          fontWeight="bold"
          fontSize="8"
          dominantBaseline="hanging"
        >
          {text}
        </text>
      </svg>
    </>
  );
};
