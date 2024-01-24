import vtkAbstractWidget from "../../Core/AbstractWidget";

export default interface vtkResliceCursorWidgetDefaultInstance extends vtkAbstractWidget {
    invokeInternalInteractionEvent: () => void;
}
