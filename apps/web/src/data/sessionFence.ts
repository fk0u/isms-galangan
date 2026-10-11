export interface SessionFence {
  isCurrent: () => boolean;
  assertCurrent: () => void;
}

/** Ikat operasi async pada satu scope sesi tanpa membocorkan token/owner ke caller. */
export function createSessionFence(expectedScope: string, readCurrentScope: () => string): SessionFence {
  const isCurrent = () => readCurrentScope() === expectedScope;
  return {
    isCurrent,
    assertCurrent: () => {
      if (!isCurrent()) throw new Error("Sesi berubah; operasi dibatalkan");
    },
  };
}
