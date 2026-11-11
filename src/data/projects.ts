import { FeaturedProject } from "@/types";

/**
 * Featured projects strictly matching approved repositories for Karthik Sherigara:
 * 1. TradeMind
 * 2. awshackathon (Enterprise Compliance GraphRAG - Hackathon Build)
 * 3. Agent-mcp (Agent Safety MCP)
 * 4. ai-research-assistant (Research Assistant AI)
 *
 * Case studies follow: Problem, Architecture, Stack, What I Built, Limitations and Next Steps.
 * Zero fabricated metrics, accuracy percentages, or production claims.
 */
export const projectsConfig: FeaturedProject[] = [
  {
    repoName: "TradeMind",
    title: "TradeMind",
    slug: "trademind",
    tagline: "Explainable financial analysis co-pilot with auditable ML signals and multi-agent commentary.",
    description:
      "A financial co-pilot integrating market technical indicators, machine-learning signals, and a multi-agent explanation pipeline to make investment signals transparent and inspectable.",
    tags: ["Python", "FastAPI", "XGBoost", "scikit-learn", "FinBERT", "LangChain", "Docker", "Vercel"],
    demoUrl: "https://trademind-orcin.vercel.app",
    githubUrl: "https://github.com/KSS-1227/TradeMind",
    isFeatured: true,
    year: "2024",
    role: "AI / ML & Backend",
    isHackathon: false,
    caseStudy: {
      problem:
        "Retail investors often encounter black-box algorithmic trading alerts that provide buy or sell labels without explaining the underlying indicators, technical patterns, or model reasoning behind the output.",
      architecture:
        "A decoupled architecture with a FastAPI backend serving market data and ML inferences, paired with a multi-agent LangChain workflow (signal, research, and explainer agents) that inspects technical indicators and transformer sentiment before generating structured, readable rationales.",
      stack: [
        "Python",
        "FastAPI & Uvicorn",
        "XGBoost & scikit-learn",
        "Hugging Face Transformers (FinBERT)",
        "LangChain & Google GenAI API",
        "pandas-ta & Backtrader",
        "Docker & Vercel",
      ],
      whatIBuilt: [
        "Trained and evaluated tabular signal classifiers using XGBoost and scikit-learn on historical market data.",
        "Integrated the FinBERT transformer model to compute sentiment polarity on incoming financial news feeds.",
        "Constructed an asynchronous FastAPI backend orchestrating multi-agent commentary pipelines with LangChain.",
        "Created historical backtesting modules with Backtrader and SHAP feature attribution to expose indicator weights.",
        "Containerized the service with Docker and deployed the web interface to Vercel.",
      ],
      limitationsAndNextSteps: [
        "Inferences rely on market API rate limits and end-of-day data feeds; real-time tick-by-tick streaming is not yet supported.",
        "Next steps: Implement automated walk-forward model retraining and expand multi-asset coverage.",
      ],
    },
  },
  {
    repoName: "awshackathon",
    title: "Enterprise Compliance Intelligence Platform",
    slug: "enterprise-compliance-graphrag",
    tagline: "Multi-Modal Knowledge Graph RAG framework for complex corporate policy compliance.",
    description:
      "A multi-modal compliance intelligence system converting complex enterprise documents into structured knowledge graphs with hybrid retrieval, Amazon Bedrock, Amazon S3, and Amazon DynamoDB.",
    tags: [
      "Python",
      "FastAPI",
      "GraphRAG",
      "Amazon S3",
      "Amazon Bedrock",
      "Amazon DynamoDB",
      "PostgreSQL/Supabase",
      "boto3",
      "Docker",
    ],
    demoUrl: undefined,
    githubUrl: "https://github.com/KSS-1227/awshackathon",
    isFeatured: true,
    year: "2024",
    role: "AI Engineering & Cloud Backend",
    isHackathon: true,
    caseStudy: {
      problem:
        "Auditing enterprise documents (PDF policies, spreadsheets, Word manuals) against strict regulatory standards with standard vector RAG suffers from fragmented context and loses cross-clause structural dependencies.",
      architecture:
        "A GraphRAG architecture where parsed multi-modal documents are mapped into a NetworkX knowledge graph. Document assets are stored in Amazon S3, asynchronous metadata and job status are tracked in Amazon DynamoDB via boto3, embeddings and generative extraction use Amazon Bedrock, and workspace data persists in PostgreSQL/Supabase.",
      stack: [
        "Python",
        "FastAPI",
        "NetworkX (Graph Modeling)",
        "Amazon S3 (Document Storage)",
        "Amazon Bedrock (Titan Embeddings & LLM)",
        "Amazon DynamoDB (Async Job Tracking)",
        "PostgreSQL / Supabase",
        "AWS SDK for Python (boto3)",
        "Docker",
      ],
      whatIBuilt: [
        "Implemented document extraction pipelines transforming heterogeneous files into structured knowledge graph nodes and edges.",
        "Built async DynamoDB client wrappers with boto3 for single-table job tracking and audit metadata operations.",
        "Integrated Amazon S3 graph storage for durable GraphML serializations and source file archiving.",
        "Engineered GraphRAG retrieval routines combining graph neighborhood traversal with dense embedding lookups via Amazon Bedrock.",
        "Set up Docker configurations and automated CI/CD workflow testing scripts.",
      ],
      limitationsAndNextSteps: [
        "Built during an AWS Hackathon sprint; certain worker microservices rely on local fallbacks if cloud credentials are absent.",
        "Next steps: Complete end-to-end integration with Amazon OpenSearch vector search and automate EventBridge asynchronous worker triggers.",
      ],
    },
  },
  {
    repoName: "Agent-mcp",
    title: "Agent Safety MCP",
    slug: "agent-safety-mcp",
    tagline: "Model Context Protocol server for idempotent, duplicate-safe action execution and plan conflict repair.",
    description:
      "A Model Context Protocol (MCP) server providing idempotent, duplicate-safe external action execution and automated plan conflict repair in front of PostgreSQL and pgvector.",
    tags: ["Node.js", "TypeScript", "PostgreSQL/Supabase", "pgvector", "MCP Protocol", "Multi-Agent Systems"],
    demoUrl: undefined,
    githubUrl: "https://github.com/KSS-1227/Agent-mcp",
    isFeatured: true,
    year: "2024",
    role: "AI Systems & Backend",
    isHackathon: false,
    caseStudy: {
      problem:
        "When autonomous AI agents execute consequential external actions (such as API mutations or database writes) concurrently, network drops, unhandled crashes, or overlapping plans can trigger duplicate writes or discard valid in-flight operations.",
      architecture:
        "A TypeScript MCP server implementing an ActionCoordinator and ActionReconciler backed by Supabase PostgreSQL with the pgvector extension. Actions follow a strict state-machine (PENDING -> APPLIED / NOT_APPLIED / UNKNOWN), and colliding agent intents are detected using vector similarity and dependency graph analysis.",
      stack: [
        "Node.js & TypeScript",
        "Model Context Protocol (MCP) SDK",
        "PostgreSQL (Supabase)",
        "pgvector Extension (Cosine Similarity)",
        "Vitest (Automated Test Suite)",
      ],
      whatIBuilt: [
        "Engineered an idempotent action coordination protocol tracking deterministic action keys and external effect states.",
        "Implemented crash-recovery reconciliation where the coordinator queries verifier endpoints before re-attempting ambiguous mutations.",
        "Constructed vector-based intent conflict detection using pgvector cosine distance to flag colliding agent objectives.",
        "Wrote automated Vitest test suites (e.g., Phase 10F external effect tests) verifying recovery behavior across simulated process crash windows.",
        "Created HTTP and stdio transport layers adhering strictly to the Model Context Protocol specification.",
      ],
      limitationsAndNextSteps: [
        "Recovery reconciliation requires target external services to support verifiable state lookups or deterministic receipt queries.",
        "Next steps: Expand verifier adapters for additional third-party external services and add distributed lock leasing.",
      ],
    },
  },
  {
    repoName: "ai-research-assistant",
    title: "Research Assistant AI",
    slug: "ai-research-assistant",
    tagline: "Deterministic multi-agent research synthesis platform with citation verification and hybrid search.",
    description:
      "A full-stack research platform orchestrating academic paper parsing, hybrid semantic search, and deterministic multi-agent synthesis with citation-level evidence checks.",
    tags: ["Python", "FastAPI", "LangChain", "Supabase", "FAISS", "BM25", "Docker", "GitHub Actions"],
    demoUrl: undefined,
    githubUrl: "https://github.com/KSS-1227/ai-research-assistant",
    isFeatured: true,
    year: "2024",
    role: "AI Engineering & Full-Stack",
    isHackathon: false,
    caseStudy: {
      problem:
        "Summarizing dense academic papers using standard generative LLMs frequently leads to unsourced factual claims, missing citations, and inaccurate technical conclusions.",
      architecture:
        "A multi-agent RAG workflow coupling FastAPI with LangChain document loaders. Queries retrieve context through a hybrid search pipeline combining FAISS dense vector retrieval with BM25 keyword matching, followed by a dedicated verification agent that validates cited spans against original source text.",
      stack: [
        "Python",
        "FastAPI & Uvicorn",
        "LangChain (Chains & Document Loaders)",
        "FAISS (Vector Store)",
        "BM25 (Rank-BM25 Lexical Search)",
        "Supabase (Authentication & Storage)",
        "Docker & GitHub Actions CI/CD",
      ],
      whatIBuilt: [
        "Constructed a hybrid retrieval pipeline combining semantic vector similarity (FAISS) with keyword token matching (BM25).",
        "Designed an evidence verification agent that parses generated assertions and ensures every claim matches retrieved source spans.",
        "Built REST endpoints in FastAPI with Supabase user authentication, session security, and PDF file management.",
        "Wrote automated test suites and configured continuous integration testing using GitHub Actions.",
        "Packaged the entire application stack in Docker for reproducible environments.",
      ],
      limitationsAndNextSteps: [
        "Complex mathematical notation and multi-column tabular data in PDFs can occasionally suffer from OCR parsing degradation.",
        "Next steps: Integrate dedicated layout-aware document visual parsers and expand cross-document synthesis capabilities.",
      ],
    },
  },
];
