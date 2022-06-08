import {
  Button,
  Popover,
  PopoverContent,
  chakra,
  VStack,
  Input,
  HStack,
  PopoverTrigger,
  InputGroup,
  InputRightAddon,
} from '@chakra-ui/react';
import { css } from '@emotion/css';
import React, { useEffect, useState } from 'react';
import { isNaN } from 'lodash-es';
import { SpaceValue } from './type';

const shortcutsStyle = css`
  column-gap: 8px;
  row-gap: 6px;
  button {
    margin: 0 !important;
  }
`;

export type SpaceConfig = {
  hasAuto: boolean;
  shortcuts: number[];
};

type SpaceEditPanelProps = {
  value: SpaceValue;
  onChange: (value: SpaceValue) => void;
  spaceConfig: SpaceConfig;
};

export const SpaceEditPanel: React.FC<SpaceEditPanelProps> = ({
  value,
  onChange,
  children,
  spaceConfig,
}) => {
  const [inputValue, setInputValue] = useState<SpaceValue>(value);
  const { hasAuto, shortcuts } = spaceConfig;

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <Popover closeOnBlur placement="bottom">
      <PopoverTrigger>{children}</PopoverTrigger>
      <chakra.div
        sx={{
          '.chakra-popover__popper': {
            inset: '0px auto auto -3px !import',
          },
        }}
      >
        <PopoverContent
          mt="1"
          p="2"
          opacity="0"
          rounded="md"
          maxH="350px"
          shadow="base"
          zIndex="popover"
          overflowY="auto"
          width="300px"
          _focus={{ boxShadow: 'none' }}
        >
          <VStack w="full">
            <HStack w="full">
              <InputGroup>
                <Input
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value as any);
                  }}
                  onBlur={() => {
                    if (inputValue === 'Auto' && hasAuto) {
                      onChange(inputValue);
                    } else if (!isNaN(Number(inputValue))) {
                      onChange(Number(inputValue));
                    } else {
                      setInputValue(value);
                    }
                  }}
                />
                <InputRightAddon>px</InputRightAddon>
              </InputGroup>
            </HStack>
            <HStack w="full">
              {hasAuto ? (
                <Button
                  onClick={() => {
                    onChange('Auto');
                  }}
                  h="full"
                  height="50px"
                  w="50px"
                >
                  Auto
                </Button>
              ) : null}
              <HStack className={shortcutsStyle} flexWrap="wrap">
                {shortcuts.map(v => (
                  <Button
                    key={v}
                    onClick={() => {
                      onChange(v);
                    }}
                    height="23px"
                    w="50px"
                    m="0"
                  >
                    {v}
                  </Button>
                ))}
              </HStack>
            </HStack>
          </VStack>
        </PopoverContent>
      </chakra.div>
    </Popover>
  );
};
