const TOUCH_POINTER_TYPES = new Set(["touch", "pen"]);
const TOUCH_TAP_FEEDBACK_CLASS = "touch-tap-feedback";
const TOUCH_TAP_FEEDBACK_MS = 140;

const setInputModality = (modality) => {
    if (typeof document === "undefined") {
        return;
    }

    const root = document.body;
    if (!root || root.dataset.inputModality === modality) {
        return;
    }

    root.dataset.inputModality = modality;
};

const blurOnTouchInteraction = (event) => {
    const target = event?.currentTarget;
    if (!target || typeof target.blur !== "function") {
        return;
    }
    if (target.disabled) {
        return;
    }

    const applyTouchTapFeedback = () => {
        if (!target.classList) {
            return;
        }

        target.classList.add(TOUCH_TAP_FEEDBACK_CLASS);
        setTimeout(() => {
            target.classList.remove(TOUCH_TAP_FEEDBACK_CLASS);
        }, TOUCH_TAP_FEEDBACK_MS);
    };

    const nativeEvent = event.nativeEvent;
    const pointerType = nativeEvent?.pointerType;

    if (typeof pointerType === "string") {
        if (pointerType === "mouse") {
            setInputModality("mouse");
        }

        if (TOUCH_POINTER_TYPES.has(pointerType)) {
            setInputModality("touch");
            applyTouchTapFeedback();
            setTimeout(() => target.blur(), 0);
        }

        return;
    }

    if (nativeEvent?.changedTouches) {
        setInputModality("touch");
        applyTouchTapFeedback();
        setTimeout(() => target.blur(), 0);
        return;
    }

    if (event.detail > 0) {
        setTimeout(() => target.blur(), 0);
    }
};

export default blurOnTouchInteraction;
