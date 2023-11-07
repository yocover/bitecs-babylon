import { Component, ComponentSchema, Types } from 'ecsy';
/**
 * Component that changes property interpolation.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions
 */
type InterpolationFunc = () => void;
export class interpolateAction extends Component<interpolateAction> {
  /**
   * Defines the path of the property where the value should be interpolated
   */
  public propertyPath?: string;
  /**
   * Defines the target value at the end of the interpolation.
   */
  public value: any;
  /**
   * Defines the time it will take for the property to interpolate to the value.
   */
  public duration?: number;
  /**
   * Defines if the other scene animations should be stopped when the action has been triggered
   */
  public stopOtherAnimations?: boolean;
  /**
   * Defines a callback raised once the interpolation animation has been done.
   */
  public onInterpolationDone?: InterpolationFunc;

  /**
   * Component data schema, used to serialize the state of components
   */
  public static schema: ComponentSchema = {
    propertyPath: { type: Types.String },
    value: { type: Types.Ref },
    duration: { type: Types.Number },
    stopOtherAnimations: { type: Types.Boolean },
    onInterpolationDone: { type: Types.Ref }
  };
}
