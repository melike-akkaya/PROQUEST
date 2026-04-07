import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';

export const HOME_MODULES = [
  {
    title: 'ProteinSearch',
    description: 'An AI-assisted UniProt search tool for finding proteins with natural-language questions. You can describe a protein, gene, organism, or function in simple terms, and ProteinSearch turns that request into a structured search and lists the most relevant matching entries for you.',
    path: '/query/llm',
    accent: '#4f7dff',
    icon: AutoAwesomeRoundedIcon,
  },
  {
    title: 'SeqSim',
    description: 'A sequence-based discovery tool for users who already have a protein sequence and want to see what it is close to. SeqSim compares sequence patterns to find similar proteins and also shows GO enrichment results, making it easier to explore likely functions and biological relationships.',
    path: '/query/vector',
    accent: '#4f8a76',
    icon: TravelExploreRoundedIcon,
  },
  {
    title: 'ProteinChat',
    description: 'A chat-based protein exploration tool for asking questions and following up naturally as your investigation grows. ProteinChat builds its answers using retrieved protein records and related context, so you can understand the response more easily and check the evidence behind it.',
    path: '/query/rag',
    accent: '#7283ec',
    icon: ForumRoundedIcon,
  },
];

export const HOME_HERO_SLIDES = [
  {
    path: '/query/llm',
    accent: '#4f7dff',
    icon: SearchRoundedIcon,
    sentence: 'Find the protein you want!',
  },
  {
    path: '/query/vector',
    accent: '#4f8a76',
    icon: BiotechRoundedIcon,
    sentence: 'Search for proteins similar to yours!',
  },
  {
    path: '/query/rag',
    accent: '#7283ec',
    icon: ForumRoundedIcon,
    sentence: 'Ask ProteinChat a question!',
  },
];

export const HOME_STATS = [
  { value: '500.000+', label: 'Proteins', accent: '#5b7cff' },
  { value: 'UniProtKB', label: 'Primary context', accent: '#6d88d6' },
  { value: 'Chat + Search', label: 'Exploration modes', accent: '#6d9a90' },
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
