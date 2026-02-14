import { AnimatePresence, motion } from "framer-motion";

export function BottomSheet(props: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { open, onClose, children } = props;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Cerrar"
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="rounded-t-3xl bg-paper-50 shadow-soft border border-black/10 max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-black/10" />
              <div className="p-4">{children}</div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
