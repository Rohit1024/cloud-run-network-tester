# VPC Egress Network Debugger

A high-performance, tree-shakeable Next.js application designed to diagnose network connectivity issues within Google Cloud VPCs (Virtual Private Clouds). This tool helps developers verify outbound internet connectivity, VPC Peering, and internal routing from within a Cloud Run or GKE environment.

## 🚀 Key Features

- **Multi-Layer Diagnostics**: Performs step-by-step OSI model checks:
  - **Layer 3 (DNS)**: Verifies domain resolution to IP.
  - **Layer 4 (TCP)**: Tests connectivity on specific ports with latency metrics.
  - **Layer 6 (TLS/SSL)**: Inspects certificate validity, issuer, and expiry.
  - **Layer 7 (HTTP)**: Validates application-level response codes (HEAD requests).
- **Performance Optimized**: 
  - Enabled Next.js **React Compiler** for efficient rendering.
  - Configured **Tree-shaking** for `lucide-react` and `radix-ui` to minimize bundle size.
  - Snappy UI interactions with custom-tuned CSS animations for accordions.
- **Production Ready**: Includes a multi-stage **Docker builds** using Next.js standalone mode for ultra-lean deployments.
- **Comprehensive Testing**: Full coverage with Vitest for Server Actions and React Testing Library for UI components.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4 + Shadcn UI
- **State Management**: TanStack React Query
- **Icons**: Lucide React
- **Testing**: Vitest + jsdom + Testing Library
- **Runtime**: Node.js 20

## 📦 Getting Started

### Local Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the tool.

3.  **Run Tests**:
    ```bash
    npm run test
    ```

### Docker Deployment

To build the production-ready standalone image:

```bash
docker build -t vpc-network-tester .
docker run -p 3000:3000 vpc-network-tester
```

The Dockerfile is optimized for **Google Cloud Run**, featuring:
- Multi-stage builds to keep image size small.
- Non-root user execution for enhanced security.
- Standalone output mode to reduce runtime dependencies.

## 🧪 Advanced Diagnostics

This tool uses specialized Node.js `net` and `tls` modules in its **Server Actions** to perform raw socket connections. This allows it to:
- Detect if a firewall (VPC Firewall Rule) is dropping packets (timeout vs. connection refused).
- Verify if a Cloud NAT is correctly masking outbound traffic by reporting the instance's **Egress IP**.

## 📄 License

MIT
