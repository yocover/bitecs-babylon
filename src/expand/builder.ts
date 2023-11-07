import { World, System, Component, ComponentConstructor } from 'ecsy';

class QueryBuilder {
  private world: World;
  private queryComponents: ComponentConstructor<any>[] = [];

  constructor(world: World) {
    this.world = world;
  }

  include<T extends Component<any>>(component: ComponentConstructor<T>) {
    this.queryComponents.push(component);
    return this;
  }

  build() {
    const CustomQuerySystem = class extends System {
      execute() {
        this.queries.custom.results.forEach(() => {
          //
        });
      }
    };

    (CustomQuerySystem as any).queries = {
      custom: { components: this.queryComponents }
    };

    this.world.registerSystem(CustomQuerySystem);
    return CustomQuerySystem;
  }
}

export default QueryBuilder;
