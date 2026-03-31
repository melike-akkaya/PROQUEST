export const PROVIDER_MODELS = {
  OpenAI: [
    'gpt-5.1',
    'gpt-5',
    'gpt-5-nano',
    'gpt-5-mini',
    'gpt-4o',
    'gpt-4.1',
    'gpt-4o-mini',
    'o4-mini',
    'o3',
    'o3-mini',
    'o1',
    'gpt-4.1-nano',
  ],
  Anthropic: [
    'claude-sonnet-4-5',
    'claude-haiku-4-5',
    'claude-opus-4-1',
  ],
  Google: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview',
  ],
  Groq: [
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'moonshotai/kimi-k2-instruct',
    'moonshotai/kimi-k2-instruct-0905',
    'llama-3.1-8b-instant',
    'groq/compound',
    'groq/compound-mini',
  ],
  OpenRouter: [
    'deepseek/deepseek-r1-distill-llama-70b',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-r1',
    'deepseek/deepseek-chat',
    'qwen/qwen3-235b-a22b-2507',
    'moonshotai/kimi-k2',
    'x-ai/grok-4',
    'x-ai/grok-3',
    'tencent/hunyuan-a13b-instruct',
  ],
  Mistral: ['mistral-small', 'codestral-latest'],
  Nvidia: [
    'meta/llama-3.1-405b-instruct',
    'meta/llama-3.1-70b-instruct',
    'meta/llama-3.1-8b-instruct',
    'nv-mistralai/mistral-nemo-12b-instruct',
    'mistralai/mixtral-8x22b-instruct-v0.1',
    'mistralai/mistral-large-2-instruct',
    'nvidia/nemotron-4-340b-instruct',
  ],
};

export const TEMPERATURE_RANGES = {
  OpenAI: { min: 0.0, max: 2.0, default: 1.0 },
  Google: { min: 0.0, max: 2.0, default: 1.0 },
  Anthropic: { min: 0.0, max: 1.0, default: 1.0 },
  Nvidia: { min: 0.0, max: 2.0, default: 1.0 },
  Mistral: { min: 0.0, max: 2.0, default: 0.7 },
  OpenRouter: { min: 0.0, max: 2.0, default: 1.0 },
  Groq: { min: 0.0, max: 2.0, default: 1.0 },
};

export const STUDIO_MODULES = [
  {
    id: 'rag',
    title: 'ProteinChat',
    eyebrow: 'Chat-first retrieval',
    description:
      'Context-aware protein chat with retrieval-backed answers.',
    accent: '#7283ec',
    accentSoft: 'rgba(114, 131, 236, 0.16)',
    metricLabel: 'Thread state',
    metricValue: 'Live',
  },
  {
    id: 'llm',
    title: 'ProteinSearch',
    eyebrow: 'Natural language to UniProt query',
    description:
      'Turn a natural-language request into a UniProt query and inspect the returned proteins.',
    accent: '#2f8cff',
    accentSoft: 'rgba(47, 140, 255, 0.18)',
    metricLabel: 'Query trace',
    metricValue: 'Visible',
  },
  {
    id: 'vector',
    title: 'SeqSim',
    eyebrow: 'Sequence-first discovery',
    description:
      'Run the embedding-based retrieval and GO enrichment flow with a cleaner analyst view.',
    accent: '#4f8a76',
    accentSoft: 'rgba(79, 138, 118, 0.14)',
    metricLabel: 'Protein similarity',
    metricValue: 'Fast',
  },
];

export const LLM_EXAMPLES = [
  "What proteins are related to Alzheimer's disease?",
  'What is the UniProt ID for insulin?',
  'List all proteins in Homo sapiens that are annotated with a GO term related to apoptosis.',
  'Retrieve proteins from rabbit proteome that are 200-500 amino acids long and contain transmembrane helixes.',
  'Retrieve all proteins in Homo sapiens with a known 3D structure',
];

export const VECTOR_EXAMPLE_SEQUENCE = `MTAIIKEIVSRNKRRYQEDGFDLDLTYIYPNIIAMGFPAERLEGVYRNNIDDVVRFLDSK
HKNHYKIYNLCAERHYDTAKFNCRVAQYPFEDHNPPQLELIKPFCEDLDQWLSEDDNHVA
AIHCKAGKGRTGVMICAYLLHRGKFLKAQEALDFYGEVRTRDKKGVTIPSQRRYVYYYSY
LLKNHLDYRPVALLFHKMMFETIPMFSGGTCNPQFVVCQLKVKIYSSNSGPTRREDKFMY
FEFPQPLPVCGDIKVEFFHKQNKMLKKDKMFHFWVNTFFIPGPEETSEKVENGSLCDQEI
DSICSIERADNDKEYLVLTLTKNDLDKANKDKANRYFSPNFKVKLYFTKTVEEPSNPEAS
SSTSVTPDVSDNEPDHYRYSDTTDSDPENEPFDEDQHTQITKV`;

export const RAG_EXAMPLES = {
  prompts: [
    'What is the catalytic activity, cofactor requirement and pathway context of human CYP2E1?',
    'What does the Amyloid-beta precursor protein do in the brain?',
    'Which proteins are functionally close to this sequence, and what evidence supports that?',
    'Explain the likely role of this protein and mention the most relevant UniProt entries.',
  ],
  case: {
    question:
      'What does the Amyloid-beta precursor protein do in the brain, and what proteins does it interact with?',
    sequence: `MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTK
TCIDTKEGILQYCQEVYPELQITNVVEANQPVTIQNWCKRGRKQCKTHPHFVIPYRCLVG
EFVSDALLVPDKCKFLHQERMDVCETHLHWHTVAKETCSEKSTNLHDYGMLLPCGIDKFR
GVEFVCCPLAEESDNVDSADAEEDDSDVWWGGADTDYADGSEDKVVEVAEEEEVAEVEEE
EADDDEDDEDGDEVEEEAEEPYEEATERTTSIATTTTTTTESVEEVVREVCSEQAETGPC
RAMISRWYFDVTEGKCAPFFYGGCGGNRNNFDTEEYCMAVCGSAMSQSLLKTTQEPLARD
PVKLPTTAASTPDAVDKYLETPGDENEHAHFQKAKERLEAKHRERMSQVMREWEEAERQA
KNLPKADKKAVIQHFQEKVESLEQEAANERQQLVETHMARVEAMLNDRRRLALENYITAL
QAVPPRPRHVFNMLKKYVRAEQKDRQHTLKHFEHVRMVDPKKAAQIRSQVMTHLRVIYER
MNQSLSLLYNVPAVAEEIQDEVDELLQKEQNYSDDVLANMISEPRISYGNDALMPSLTET
KTTVELLPVNGEFSLDDLQPWHSFGADSVPANTENEVEPVDARPAADRGLTTRPGSGLTN
IKTEEISEVKMDAEFRHDSGYEVHHQKLVFFAEDVGSNKGAIIGLMVGGVVIATVIVITL
VMLKKKQYTSIHHGVVEVDAAVTPEERHLSKMQQNGYENPTYKFFEQMQN`,
  },
};

export const INITIAL_RAG_MESSAGE = {
  id: 'rag-welcome',
  role: 'assistant',
  content:
    'Ask a protein question, optionally attach a sequence, and continue with follow-up turns in the same thread.',
  suggestions: [
    'What is the function of human albumin?',
    'Summarize the likely role of this sequence.',
    "Which proteins are related to Alzheimer's disease?",
  ],
};
