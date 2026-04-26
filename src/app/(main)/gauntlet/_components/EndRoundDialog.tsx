"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    holesCompleted: number;
    onConfirm: () => void;
};

export function EndRoundDialog({
    open,
    onOpenChange,
    holesCompleted,
    onConfirm,
}: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        End round after hole {holesCompleted}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Final standings will be calculated from the current{" "}
                        {holesCompleted} hole
                        {holesCompleted === 1 ? "" : "s"}. You can still edit scores
                        afterwards, but no new holes can be added.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        End round
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
