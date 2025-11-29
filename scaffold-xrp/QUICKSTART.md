# Quick Start Guide

Get started with Scaffold-XRP in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher

## Installation

```bash
# Clone the repository
git clone https://github.com/XRPL-Commons/scaffold-xrp.git
cd scaffold-xrp

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

### 1. Connect Your Wallet

Click the "Connect Wallet" button in the header and choose:
- **Xaman** - If you have Xaman wallet extension
- **Crossmark** - If you have Crossmark wallet extension
- **GemWallet** - If you have GemWallet extension
- **Manual** - Enter any XRPL address to view (read-only)

### 2. Get Test XRP

1. Make sure you're on **AlphaNet** (check the network switcher in the header)
2. Scroll to the "Faucet" section
3. Click "Request Test XRP"
4. Wait a few seconds for your balance to update

You'll receive 1000 XRP on AlphaNet for testing!

## What's Next?

- Read the [full README](README.md) for detailed documentation
- Explore the source code in `apps/web/components/`
- Switch networks using the network switcher
- View your transaction history with explorer links

## Need Help?

- Check the [XRPL Documentation](https://xrpl.org/)
- Review the [Contributing Guide](CONTRIBUTING.md)

## Common Issues

### Wallet Not Detected
Make sure you have the wallet extension installed and unlocked.

### Transaction Failed
- Check you have sufficient XRP balance
- Verify you're on the correct network
- Try refreshing your balance

### Build Errors
```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

Happy building on XRPL! 🚀
