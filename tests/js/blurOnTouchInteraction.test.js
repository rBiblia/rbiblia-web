import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import blurOnTouchInteraction from '../../assets/js/blurOnTouchInteraction';

describe('blurOnTouchInteraction', () => {
    let mockTarget;

    beforeEach(() => {
        vi.useFakeTimers();
        mockTarget = {
            blur: vi.fn(),
            classList: {
                add: vi.fn(),
                remove: vi.fn(),
            },
            disabled: false,
        };

        // Reset document.body
        delete document.body.dataset.inputModality;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does nothing if target has no blur function', () => {
        blurOnTouchInteraction({ currentTarget: {} });
        expect(document.body.dataset.inputModality).toBeUndefined();
    });

    it('does nothing if target is disabled', () => {
        mockTarget.disabled = true;
        blurOnTouchInteraction({ currentTarget: mockTarget });
        expect(mockTarget.blur).not.toHaveBeenCalled();
    });

    it('sets inputModality to mouse for mouse pointerType', () => {
        blurOnTouchInteraction({
            currentTarget: mockTarget,
            nativeEvent: { pointerType: 'mouse' }
        });
        expect(document.body.dataset.inputModality).toBe('mouse');
        expect(mockTarget.blur).not.toHaveBeenCalled();
    });

    it('blurs target and applies touch feedback for touch pointerType', () => {
        blurOnTouchInteraction({
            currentTarget: mockTarget,
            nativeEvent: { pointerType: 'touch' }
        });
        
        expect(document.body.dataset.inputModality).toBe('touch');
        expect(mockTarget.classList.add).toHaveBeenCalledWith('touch-tap-feedback');
        
        vi.advanceTimersByTime(0);
        expect(mockTarget.blur).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(140);
        expect(mockTarget.classList.remove).toHaveBeenCalledWith('touch-tap-feedback');
    });

    it('handles changedTouches fallback', () => {
        blurOnTouchInteraction({
            currentTarget: mockTarget,
            nativeEvent: { changedTouches: [{}] }
        });
        
        expect(document.body.dataset.inputModality).toBe('touch');
        vi.advanceTimersByTime(0);
        expect(mockTarget.blur).toHaveBeenCalledTimes(1);
    });

    it('handles detail > 0 fallback', () => {
        blurOnTouchInteraction({
            currentTarget: mockTarget,
            detail: 1
        });
        
        vi.advanceTimersByTime(0);
        expect(mockTarget.blur).toHaveBeenCalledTimes(1);
    });
});
