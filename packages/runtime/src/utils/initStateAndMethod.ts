import { RuntimeComponentSchema } from '@sunmao-ui/core';
import { Static, TSchema } from '@sinclair/typebox';
import { RegistryInterface } from '../services/Registry';
import { StateManagerInterface } from '../services/StateManager';
import {
  ModuleRenderSpec,
  parseTypeBox,
  CORE_VERSION,
  CoreComponentName,
} from '@sunmao-ui/shared';

export function initStateAndMethod(
  registry: RegistryInterface,
  stateManager: StateManagerInterface,
  components: RuntimeComponentSchema[]
) {
  components.forEach(c => initSingleComponentState(registry, stateManager, c));
}

export function initSingleComponentState(
  registry: RegistryInterface,
  stateManager: StateManagerInterface,
  c: RuntimeComponentSchema
) {
  if (stateManager.store[c.id]) {
    return false;
  }
  let state = {};
  c.traits.forEach(t => {
    const tSpec = registry.getTrait(t.parsedType.version, t.parsedType.name).spec;
    state = { ...state, ...parseTypeBox(tSpec.state as TSchema) };
  });
  const cSpec = registry.getComponent(c.parsedType.version, c.parsedType.name).spec;
  state = { ...state, ...parseTypeBox(cSpec.state as TSchema) };

  stateManager.store[c.id] = state;

  if (c.type === `${CORE_VERSION}/${CoreComponentName.ModuleContainer}`) {
    const moduleSchema = c.properties as Static<typeof ModuleRenderSpec>;
    try {
      const mSpec = registry.getModuleByType(moduleSchema.type).spec;
      const moduleInitState: Record<string, unknown> = {};
      for (const key in mSpec) {
        moduleInitState[key] = undefined;
      }
      stateManager.store[moduleSchema.id] = moduleInitState;
    } catch {}
  }
}
