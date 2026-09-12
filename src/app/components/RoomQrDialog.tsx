"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { QRCodeSVG } from "qrcode.react";

export function RoomQrDialog({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={url !== null}
      onClose={onClose}
      className="fixed inset-0 z-50"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/70" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="max-h-full w-full max-w-2xl overflow-y-auto border-2 border-zinc-950 bg-white p-5 text-center text-zinc-950 shadow-cyan scheme-light">
          <DialogTitle className="text-xl font-black">
            Scan to join the room
          </DialogTitle>
          {url && (
            <QRCodeSVG
              value={url}
              size={640}
              level="M"
              marginSize={4}
              role="img"
              title="Room invitation QR code"
              className="mx-auto my-4 h-auto max-h-[65dvh] w-full"
            />
          )}
          <p className="break-all font-mono text-xs">{url}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 min-h-11 border-2 border-zinc-950 px-6 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Close QR code
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
