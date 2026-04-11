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
      'Ask protein questions in a chat flow and keep the retrieved evidence close to the answer.',
    accent: '#7283ec',
    accentSoft: 'rgba(114, 131, 236, 0.16)',
    metricLabel: 'Thread state',
    metricValue: 'Live',
    howToUse: {
      label: 'How to use',
      subtitle: 'Quick setup for ProteinChat',
      steps: [
        {
          lead: 'Choose a provider',
          body: 'for the chat model you want to use.',
        },
        {
          lead: 'Pick a model',
          body: 'that fits the depth and speed you want.',
        },
        {
          lead: 'Add your API key',
          body: 'if the selected provider needs one.',
        },
        {
          lead: 'Write your question',
          body: 'and add a sequence only when it helps this turn.',
        },
        {
          lead: 'Send the chat',
          body: 'to get an answer with retrieved protein context.',
        },
      ],
    },
    details: [
      {
        tone: 'search',
        text: 'Use ProteinChat when you want to ask a protein question and explore the answer in a more conversational way.',
      },
      {
        tone: 'flow',
        text: 'It works by retrieving relevant protein context for your prompt and using that context to shape the reply.',
      },
      {
        tone: 'warning',
        text: 'Even with retrieval support, the answer should still be checked against the cited proteins, annotations, and evidence shown in the thread.',
      },
      {
        tone: 'warning',
        text: 'From Advanced settings, you can lower retrieved proteins (top K) to reduce token usage; at 10, prompts can reach roughly 50k-60k tokens.',
      },
    ],
  },
  {
    id: 'llm',
    title: 'ProteinSearch',
    eyebrow: 'Natural language to UniProt query',
    description:
      'Search UniProt with a natural-language question and review the protein matches in one place.',
    accent: '#2f8cff',
    accentSoft: 'rgba(47, 140, 255, 0.18)',
    metricLabel: 'Query trace',
    metricValue: 'Visible',
    howToUse: {
      label: 'How to use',
      subtitle: 'Quick setup for ProteinSearch',
      steps: [
        {
          lead: 'Choose a provider',
          body: 'to decide which service you want to use.',
        },
        {
          lead: 'Pick a model',
          body: 'that matches the speed and quality you need.',
        },
        {
          lead: 'Add your API key',
          body: 'if the selected provider requires one.',
        },
        {
          lead: 'Write your question',
          body: 'as a natural-language protein search.',
        },
        {
          lead: 'Run the search',
          body: 'and inspect the UniProt matches that come back.',
        },
      ],
    },
    details: [
      {
        tone: 'search',
        text: 'Use ProteinSearch to quickly find UniProt entries that match the protein question you have in mind.',
      },
      {
        tone: 'flow',
        text: 'It works by using an LLM to turn your request into a UniProt-ready search and then listing the closest protein matches.',
      },
      {
        tone: 'warning',
        text: 'Because this is an LLM-guided search, it is best to confirm the results with UniProt annotations, reviewed status, organism, and function.',
      },
    ],
  },
  {
    id: 'vector',
    title: 'SeqSim',
    eyebrow: 'Sequence-first discovery',
    description:
      'Paste a protein sequence, find similar proteins, and review enrichment results in one focused view.',
    accent: '#4f8a76',
    accentSoft: 'rgba(79, 138, 118, 0.14)',
    metricLabel: 'Protein similarity',
    metricValue: 'Fast',
    howToUse: {
      label: 'How to use',
      subtitle: 'Quick setup for SeqSim',
      steps: [
        {
          lead: 'Paste a sequence',
          body: 'to start the similarity search.',
        },
        {
          lead: 'Load the example',
          body: 'if you want to test the flow first.',
        },
        {
          lead: 'Run the search',
          body: 'to find proteins with similar sequence patterns.',
        },
        {
          lead: 'Review the matches',
          body: 'to inspect the closest proteins returned.',
        },
        {
          lead: 'Check GO enrichment',
          body: 'to see the functional signals around the result set.',
        },
      ],
    },
    details: [
      {
        tone: 'search',
        text: 'Use SeqSim when you already have a protein sequence and want to find similar proteins quickly.',
      },
      {
        tone: 'flow',
        text: 'It works by embedding your sequence, retrieving the closest matches, and then summarizing GO enrichment from the result set.',
      },
      {
        tone: 'warning',
        text: 'Similarity results are useful starting points, but they should still be reviewed with sequence context, organism, and downstream annotations.',
      },
    ],
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

const RAG_EXAMPLE_SEQUENCE = `MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTK
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
VMLKKKQYTSIHHGVVEVDAAVTPEERHLSKMQQNGYENPTYKFFEQMQN`;

export const RAG_EXAMPLES = {
  prompts: [
    { question: 'What is the catalytic activity, cofactor requirement and pathway context of human CYP2E1?' },
    { question: 'What does the Amyloid-beta precursor protein do in the brain?' },
    {
      question: 'Which proteins are functionally close to this sequence, and what evidence supports that?',
      sequence: RAG_EXAMPLE_SEQUENCE,
    },
    {
      question: 'Explain the likely role of this protein and mention the most relevant UniProt entries.',
      sequence: RAG_EXAMPLE_SEQUENCE,
    },
  ],
  case: {
    question:
      'What does the Amyloid-beta precursor protein do in the brain, and what proteins does it interact with?',
    sequence: RAG_EXAMPLE_SEQUENCE,
  },
};

export const INITIAL_RAG_MESSAGE = {
  id: 'rag-welcome',
  role: 'assistant',
  content:
    'Ask a protein question, optionally attach a sequence, and continue with follow-up turns in the same thread.',
  suggestions: [
    'What is the function of human albumin?',
    'Which pathways is human TP53 involved in?',
    "Which proteins are related to Alzheimer's disease?",
  ],
};
