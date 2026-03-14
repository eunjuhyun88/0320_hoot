import { writable, derived } from 'svelte/store';

export interface WalletState {
  connected: boolean;
  address: string;
  name: string;
}

function createWalletStore() {
  const { subscribe, set, update } = writable<WalletState>({
    connected: false,
    address: '',
    name: '',
  });

  function connect(walletName: string) {
    // Simulated wallet addresses per provider
    const addrMap: Record<string, string> = {
      Phantom: '0x7f3a...b2c1',
      Solflare: '0x4E9c...1A3d',
      Backpack: '0x2D8f...6E7a',
    };
    set({
      connected: true,
      address: addrMap[walletName] ?? '0x0000...0000',
      name: walletName,
    });
  }

  function disconnect() {
    set({ connected: false, address: '', name: '' });
  }

  return { subscribe, connect, disconnect };
}

export const wallet = createWalletStore();
