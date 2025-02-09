export type Metadata<TAnnotations = Record<string, unknown>> = {
  name: string;
  description?: string;
  annotations?: Record<string, any> & TAnnotations;
};

type ComponentCategory =
  | (string & {})
  | 'Layout'
  | 'Input'
  | 'Display'
  | 'Advance'
  | undefined;

export type ComponentMetadata = Metadata<{ category?: ComponentCategory }> & {
  // TODO:(yanzhen): move to annotations
  isDraggable: boolean;
  isResizable: boolean;
  displayName: string;
  icon?: string;
  exampleProperties: Record<string, unknown>;
  exampleSize: [number, number];
};
