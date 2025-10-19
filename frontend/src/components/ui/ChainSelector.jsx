import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useMultichain } from '@/hooks/useMultichain';

export default function ChainSelector({ onChainSelect, showProtocols = false }) {
  const { 
    currentChain, 
    supportedChains, 
    switchToChain, 
    isSwitching, 
    getProtocolsForChain,
    switchError 
  } = useMultichain();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleChainSelect = async (chainId) => {
    setIsOpen(false);
    
    if (chainId === currentChain?.id) return;
    
    try {
      await switchToChain(chainId);
      onChainSelect?.(chainId);
    } catch (error) {
      console.error('Chain switch failed:', error);
    }
  };

  if (!currentChain) {
    return (
      <div className="text-sm text-gray-500 px-3 py-2 rounded-lg border">
        Unsupported chain
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {/* Chain Icon */}
        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <img 
            src={currentChain.iconUrl} 
            alt={currentChain.name}
            className="w-4 h-4"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Chain Name */}
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {isSwitching ? 'Switching...' : currentChain.name}
        </span>
        
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
              Select Network
            </div>
            
            {supportedChains.map((chain) => {
              const protocols = getProtocolsForChain(chain.id);
              const isActive = chain.id === currentChain.id;
              
              return (
                <button
                  key={chain.id}
                  onClick={() => handleChainSelect(chain.id)}
                  disabled={isSwitching}
                  className={`w-full flex items-start gap-3 px-2 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {/* Chain Icon */}
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mt-0.5">
                    <img 
                      src={chain.iconUrl} 
                      alt={chain.name}
                      className="w-5 h-5"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="font-medium">{chain.name}</div>
                    
                    {showProtocols && protocols.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {protocols.slice(0, 3).join(', ')}
                        {protocols.length > 3 && ` +${protocols.length - 3} more`}
                      </div>
                    )}
                  </div>
                  
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </button>
              );
            })}
          </div>
          
          {switchError && (
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-red-600 dark:text-red-400">
                Failed to switch: {switchError.message}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}