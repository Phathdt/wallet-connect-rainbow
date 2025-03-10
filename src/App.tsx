import { useState, useEffect } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';

import {
  http,
  WagmiProvider,
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSendTransaction,
  useSwitchChain,
} from 'wagmi';
import { sepolia, baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { parseEther } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const queryClient = new QueryClient();

const projectId = 'd04aa36dc1fcfb0744feed2303a64fc0';

const config = getDefaultConfig({
  appName: 'My Web3 App',
  projectId: projectId,
  chains: [sepolia, baseSepolia],
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});

const DirectWalletConnect = () => {
  const { address, isConnected, chain } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [switchingNetwork, setSwitchingNetwork] = useState<boolean>(false);

  const { data: signMessageData, signMessageAsync, error: signError } = useSignMessage();

  const { data: sendTransactionData, sendTransactionAsync, error: sendError } = useSendTransaction();

  useEffect(() => {
    if (signMessageData) {
      setSignature(signMessageData);
    }
  }, [signMessageData]);

  const manualConnect = async (walletType: string) => {
    try {
      if (walletType === 'metamask' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("MetaMask connected manually!");

        window.location.reload();
      } else {
        alert("Không thể kết nối với ví. Vui lòng đảm bảo ví đã được cài đặt.");
      }
    } catch (error) {
      console.error("Manual connect error:", error);
      alert(`Lỗi kết nối thủ công: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const FallbackMetaMaskConnect = () => (
    <button
      onClick={() => manualConnect('metamask')}
      style={{
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      Nếu có vấn đề - Kết nối MetaMask thủ công
    </button>
  );
  useEffect(() => {
    if (sendTransactionData) {
      setTxHash(sendTransactionData);
    }
  }, [sendTransactionData]);

  const supportedWallets = [
    { id: 'okx', name: 'OKX Wallet', color: '#000' },
    { id: 'metaMask', name: 'MetaMask', color: '#E8831D' },
    { id: 'trust', name: 'Trust Wallet', color: '#3375BB' },
    { id: 'rabby', name: 'Rabby Wallet', color: '#8697FF' },
    { id: 'walletConnect', name: 'WalletConnect (Mobile)', color: '#3B99FC' },
  ];

  const supportedNetworks = [
    { id: sepolia.id, name: 'Sepolia', chainId: sepolia.id, color: '#6d28d9' },
    { id: baseSepolia.id, name: 'Base Sepolia', chainId: baseSepolia.id, color: '#0052ff' },
  ];

  const handleConnectWallet = async (walletId: string) => {
    setConnectingWallet(walletId);

    try {
      const connector = connectors.find((c) => {
        console.log("Available connector:", c.name, c.id);

        const connectorName = c.name.toLowerCase();

        if (walletId === 'metaMask' && (connectorName.includes('metamask') || c.id === 'metaMask')) {
          return true;
        }
        if (walletId === 'trust' && (connectorName.includes('trust') || c.id === 'trust')) {
          return true;
        }
        if (walletId === 'okx' && (connectorName.includes('okx') || c.id === 'okx')) {
          return true;
        }
        if (walletId === 'rabby' && (connectorName.includes('rabby') || c.id === 'rabby')) {
          return true;
        }
        if (walletId === 'walletConnect' && (connectorName.includes('walletconnect') || c.id === 'walletConnect')) {
          return true;
        }

        return false;
      });

      console.log("Selected connector:", connector?.name || "No connector found");

      if (connector) {
        const result = await connectAsync({ connector });
        console.log("Connection result:", result);
      } else {
        console.error(`No connector found for wallet: ${walletId}`);
        alert(`Không tìm thấy connector cho ví: ${walletId}. Vui lòng thử lại hoặc chọn ví khác.`);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(`Lỗi kết nối: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleSwitchNetwork = async (chainId: number) => {
    if (!isConnected) return;

    setSwitchingNetwork(true);
    try {
      await switchChainAsync({ chainId });
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setSignature(null);
    setTxHash(null);
  };

  const handleSignMessage = async () => {
    if (isConnected) {
      try {
        const sig = await signMessageAsync({ message: 'Hello from my app!' });
        setSignature(sig);
      } catch (error) {
        console.error('Sign message error:', error);
      }
    }
  };

  const handleSendTransaction = async () => {
    if (isConnected) {
      try {
        const tx = await sendTransactionAsync({
          to: '0x78Bdc100555672a193359bd3e9CD68F23015A051',
          value: parseEther('0.001'),
        });
        setTxHash(tx);
      } catch (error) {
        console.error('Send transaction error:', error);
      }
    }
  };

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Connect Your Wallet</h1>

      {isMobile() && !isConnected && (
        <div style={{ marginBottom: '20px', backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
          <p style={{ margin: '0', fontSize: '14px', marginBottom: '10px' }}>
            <strong>Đang sử dụng thiết bị di động:</strong> Nhấn vào ví bạn muốn sử dụng.
          </p>
          <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
            RainbowKit sẽ hiển thị QR code để quét hoặc mở ứng dụng ví nếu được cài đặt.
          </p>
        </div>
      )}

      {!isConnected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {supportedWallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleConnectWallet(wallet.id)}
              disabled={!!connectingWallet}
              style={{
                padding: '12px 20px',
                backgroundColor: wallet.color,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                position: 'relative',
              }}
            >
              {connectingWallet === wallet.id ? 'Connecting...' : `Connect ${wallet.name}`}
            </button>
          ))}

          {}
          <FallbackMetaMaskConnect />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Connected Account</h3>
            <p style={{ wordBreak: 'break-all' }}><strong>Address:</strong> {address}</p>
            <p><strong>Network:</strong> {chain?.name || 'Unknown'}</p>
          </div>

          <div>
            <h3>Select Network</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              {supportedNetworks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => handleSwitchNetwork(network.chainId)}
                  disabled={switchingNetwork || chain?.id === network.chainId}
                  style={{
                    padding: '10px',
                    backgroundColor: chain?.id === network.chainId ? '#e0e0e0' : network.color,
                    color: chain?.id === network.chainId ? '#000' : 'white',
                    border: chain?.id === network.chainId ? '2px solid #000' : 'none',
                    borderRadius: '4px',
                    cursor: chain?.id === network.chainId ? 'default' : 'pointer',
                    opacity: chain?.id === network.chainId ? 0.7 : 1,
                  }}
                >
                  {chain?.id === network.chainId ? `Currently on ${network.name}` : `Switch to ${network.name}`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSignMessage}
              style={{
                padding: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Sign Message
            </button>

            <button
              onClick={handleSendTransaction}
              style={{
                padding: '10px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Send Transaction
            </button>

            <button
              onClick={handleDisconnect}
              style={{
                padding: '10px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Disconnect
            </button>
          </div>

          {signature && (
            <div style={{ padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
              <h3>Signature</h3>
              <p style={{ wordBreak: 'break-all' }}>{signature}</p>
            </div>
          )}

          {txHash && (
            <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
              <h3>Transaction Sent</h3>
              <p style={{ wordBreak: 'break-all' }}><strong>Hash:</strong> {txHash}</p>
            </div>
          )}

          {(signError || sendError) && (
            <div style={{ padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px', color: '#c62828' }}>
              <h3>Error</h3>
              <p>{signError?.message || sendError?.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          showRecentTransactions={true}>
          <DirectWalletConnect />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;
