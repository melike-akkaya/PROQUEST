import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';

export const HOME_MODULES = [
  {
    title: 'LLM Query',
    description: 'Translate natural language into precise UniProt queries and inspect the results clearly.',
    path: '/studio?module=llm',
    accent: '#4f7dff',
    icon: AutoAwesomeRoundedIcon,
  },
  {
    title: 'Vector Search',
    description: 'Paste a sequence and review similar proteins with enrichment data in one place.',
    path: '/studio?module=vector',
    accent: '#4f8a76',
    icon: TravelExploreRoundedIcon,
  },
  {
    title: 'RAG Chat',
    description: 'Work in a chat-first flow while keeping retrieval context and protein references visible.',
    path: '/studio?module=rag',
    accent: '#7283ec',
    icon: ForumRoundedIcon,
  },
];

export const HOME_STATS = [
  { value: '3', label: 'Core workflows' },
  { value: 'UniProtKB', label: 'Primary context' },
  { value: 'Chat + Search', label: 'Exploration modes' },
];

export const FOOTER_LINKS = [
  { label: 'GitHub Repository', href: 'https://github.com/HUBioDataLab/PROQUEST' },
  { label: 'Contact', href: 'mailto:tuncadogan@gmail.com' },
];

export const FOOTER_MEDIA = [
  { key: 'poster', label: 'Poster', type: 'pdf', icon: ScienceRoundedIcon },
  { key: 'demo', label: 'Demo', type: 'video', icon: TravelExploreRoundedIcon },
  { key: 'intro', label: 'Introduction', type: 'video', icon: ForumRoundedIcon },
];

export const FOOTER_TEAM = [
  { name: 'Sezin Yavuz', role: 'Student' },
  { name: 'Rauf Yanmaz', role: 'Student' },
  { name: 'Melike Akkaya', role: 'Student' },
  { name: 'Tunca Dogan', role: 'Supervisor', url: 'https://yunus.hacettepe.edu.tr/~tuncadogan/' },
];
