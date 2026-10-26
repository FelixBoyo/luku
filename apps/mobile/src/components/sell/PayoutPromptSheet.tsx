import React from 'react';
import { ConfirmDialog } from '../common/ConfirmDialog';

type PayoutPromptSheetProps = {
    visible: boolean;
    onAddDetails: () => void;
    onSkip: () => void;
};

export const PayoutPromptSheet: React.FC<PayoutPromptSheetProps> = ({
    visible,
    onAddDetails,
    onSkip,
}) => (
    <ConfirmDialog
        visible={visible}
        title="Where should we send your money?"
        description="Add payout details so we can pay you when an item sells. You can skip this for now."
        confirmLabel="Add details"
        cancelLabel="Skip"
        onConfirm={onAddDetails}
        onCancel={onSkip}
    />
);
