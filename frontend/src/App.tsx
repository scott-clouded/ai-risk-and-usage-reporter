import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  Users, 
  BarChart3, 
  FileSpreadsheet, 
  Search, 
  Info, 
  Sparkles, 
  ArrowRight, 
  Activity, 
  Layers, 
  Database,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import './App.css';

// TypeScript Interfaces
interface Summary {
  totalAppsScanned: number;
  totalAiAppsFound: number;
  averageRiskScore: number;
  overallSecurityPosture: 'Good' | 'Warning' | 'Critical';
  totalSignInsAcrossAiApps: number;
}

interface AppUsage {
  totalSignIns: number;
  uniqueUsersCount: number;
  topUsers: { email: string; count: number }[];
  topDepartments: { name: string; count: number }[];
}

interface AIApp {
  appId: string;
  name: string;
  publisher: string;
  permissions: string[];
  isCertified: boolean;
  isAI?: boolean;
  trustScore: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  highRiskPerms: { name: string; desc: string }[];
  medRiskPerms: { name: string; desc: string }[];
  lowRiskPerms: { name: string; desc: string }[];
  usage: AppUsage;
}

interface Analytics {
  topGlobalUsers: { user: string; count: number }[];
  topGlobalDepts: { dept: string; count: number }[];
  usageOverTime: { date: string; count: number }[];
}

interface UserApp {
  appId: string;
  name: string;
  count: number;
  isAI: boolean;
}

interface UserUsage {
  user: string;
  department: string;
  totalSignIns: number;
  appsUsed: UserApp[];
}

interface AnalysisResults {
  summary: Summary;
  aiApplications: AIApp[];
  allApplications: AIApp[];
  usersUsage: UserUsage[];
  analytics: Analytics;
}

const API_BASE = window.location.port === '5173' ? 'http://localhost:5001/api' : '/api';

function App() {
  // Application State
  const [appsFile, setAppsFile] = useState<File | null>(null);
  const [signinsFile, setSigninsFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState(false);
  
  // UI Controls
  const [activeTab, setActiveTab] = useState<'dashboard' | 'risk' | 'all' | 'users' | 'marked'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [selectedApp, setSelectedApp] = useState<AIApp | null>(null);
  const [showHowToExport, setShowHowToExport] = useState(false);

  // All Apps Filtering & Sorting
  const [allAppsSearch, setAllAppsSearch] = useState('');
  const [allAppsFilter, setAllAppsFilter] = useState<'All' | 'AI' | 'Standard'>('All');
  const [allAppsSort, setAllAppsSort] = useState<'Name' | 'SignIns' | 'RiskLevel' | 'TrustScore'>('SignIns');

  // Application Manual Marks
  const [userAIMarks, setUserAIMarks] = useState<Record<string, boolean>>({});
  const [markedForRemoval, setMarkedForRemoval] = useState<Set<string>>(new Set());

  const getAppEffectiveIsAI = (app: AIApp) => {
    if (userAIMarks[app.appId] !== undefined) return userAIMarks[app.appId];
    return !!app.isAI;
  };

  const toggleMarkForRemoval = (appId: string) => {
    setMarkedForRemoval(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) newSet.delete(appId);
      else newSet.add(appId);
      return newSet;
    });
  };

  const exportMarkedToCSV = () => {
    if (!results) return;
    const markedApps = results.allApplications.filter(app => userAIMarks[app.appId] !== undefined || markedForRemoval.has(app.appId));
    const headers = ['Application ID', 'Name', 'Publisher', 'Marked As AI', 'Marked For Removal', 'Total Logins', 'Risk Level'];
    const rows = markedApps.map(app => [
      app.appId,
      app.name,
      app.publisher,
      getAppEffectiveIsAI(app) ? 'Yes' : 'No',
      markedForRemoval.has(app.appId) ? 'Yes' : 'No',
      app.usage.totalSignIns.toString(),
      app.riskLevel
    ]);
    downloadCSV('entra_marked_applications.csv', headers, rows);
  };

  // Check backend server status on mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }
      } catch (err) {
        setServerOnline(false);
      }
    };
    checkServer();
  }, []);

  // Handle local Demo loading
  const handleLoadDemo = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/demo`);
      if (!response.ok) throw new Error('Server demo endpoint failed');
      const data = await response.json();
      setResults(data);
      setActiveTab('dashboard');
    } catch (err) {
      console.warn('Backend server demo failed, loading static frontend demo fallback', err);
      // Let's import the mock generator and parser client side if backend is down!
      // But we can just use static pre-analyzed mock fallback!
      loadStaticDemoFallback();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadStaticDemoFallback = () => {
    // Elegant hardcoded fallback so client ALWAYS works even if backend is inaccessible
    const staticDemo: AnalysisResults = {
      summary: {
        totalAppsScanned: 14,
        totalAiAppsFound: 8,
        averageRiskScore: 43,
        overallSecurityPosture: 'Warning',
        totalSignInsAcrossAiApps: 342
      },
      aiApplications: [
        {
          appId: '148f43ad-2ba8-4c91-9e23-289cfaf2308a',
          name: 'GitHub Copilot for Business',
          publisher: 'GitHub Inc.',
          permissions: ['User.Read', 'Files.Read.All'],
          isCertified: true,
          trustScore: 85,
          riskLevel: 'Low',
          highRiskPerms: [],
          medRiskPerms: [{ name: 'Files.Read.All', desc: 'Read all files user can access' }],
          lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
          usage: {
            totalSignIns: 124,
            uniqueUsersCount: 5,
            topUsers: [
              { email: 'alice.smith@enterprise.com', count: 48 },
              { email: 'bob.jones@enterprise.com', count: 32 },
              { email: 'charlie.brown@enterprise.com', count: 24 }
            ],
            topDepartments: [
              { name: 'Engineering', count: 124 }
            ]
          }
        },
        {
          appId: '6438f61a-2258-4521-ba31-893dca9fbe1e',
          name: 'OpenAI ChatGPT Enterprise',
          publisher: 'OpenAI Inc.',
          permissions: ['User.Read', 'Files.ReadWrite.All', 'Mail.ReadWrite', 'Calendars.ReadWrite'],
          isCertified: true,
          trustScore: 40,
          riskLevel: 'High',
          highRiskPerms: [
            { name: 'Files.ReadWrite.All', desc: 'Read and write all files user can access' },
            { name: 'Mail.ReadWrite', desc: 'Read and write user mail' },
            { name: 'Calendars.ReadWrite', desc: 'Read and write user calendars' }
          ],
          medRiskPerms: [],
          lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
          usage: {
            totalSignIns: 98,
            uniqueUsersCount: 9,
            topUsers: [
              { email: 'diana.ross@enterprise.com', count: 22 },
              { email: 'alice.smith@enterprise.com', count: 18 },
              { email: 'karen.exec@enterprise.com', count: 15 }
            ],
            topDepartments: [
              { name: 'Marketing', count: 35 },
              { name: 'Engineering', count: 32 },
              { name: 'Executive', count: 21 },
              { name: 'Finance', count: 10 }
            ]
          }
        },
        {
          appId: 'fae8913b-18a8-4444-a901-7fa8623b30ad',
          name: 'Claude.ai Team Workspace',
          publisher: 'Anthropic PBC',
          permissions: ['User.Read', 'Directory.Read.All', 'Files.Read.All'],
          isCertified: true,
          trustScore: 70,
          riskLevel: 'Medium',
          highRiskPerms: [],
          medRiskPerms: [
            { name: 'Directory.Read.All', desc: 'Read directory data' },
            { name: 'Files.Read.All', desc: 'Read all files user can access' }
          ],
          lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
          usage: {
            totalSignIns: 54,
            uniqueUsersCount: 6,
            topUsers: [
              { email: 'diana.ross@enterprise.com', count: 18 },
              { email: 'fiona.gallagher@enterprise.com', count: 12 },
              { email: 'ian.mckellen@enterprise.com', count: 10 }
            ],
            topDepartments: [
              { name: 'Marketing', count: 30 },
              { name: 'Finance', count: 14 },
              { name: 'Engineering', count: 10 }
            ]
          }
        },
        {
          appId: 'ca77bc9a-7b3c-43d1-9bc1-12f7a93cbaef',
          name: 'Custom Shadow-GPT Connector',
          publisher: 'Unknown / Rogue Dev',
          permissions: ['User.Read', 'Directory.ReadWrite.All', 'AppRoleAssignment.ReadWrite.All'],
          isCertified: false,
          trustScore: 10,
          riskLevel: 'High',
          highRiskPerms: [
            { name: 'Directory.ReadWrite.All', desc: 'Read and write directory data' },
            { name: 'AppRoleAssignment.ReadWrite.All', desc: 'Manage app role assignments' }
          ],
          medRiskPerms: [],
          lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
          usage: {
            totalSignIns: 24,
            uniqueUsersCount: 4,
            topUsers: [
              { email: 'bob.jones@enterprise.com', count: 12 },
              { email: 'ethan.hunt@enterprise.com', count: 6 },
              { email: 'charlie.brown@enterprise.com', count: 4 }
            ],
            topDepartments: [
              { name: 'Engineering', count: 16 },
              { name: 'Marketing', count: 8 }
            ]
          }
        },
        {
          appId: 'df4230ba-47bc-4999-a931-15cfcb3a59a9',
          name: 'v0.dev Frontend Assistant',
          publisher: 'Vercel Inc.',
          permissions: ['User.Read', 'Files.ReadWrite.All'],
          isCertified: false,
          trustScore: 40,
          riskLevel: 'High',
          highRiskPerms: [{ name: 'Files.ReadWrite.All', desc: 'Read and write all files user can access' }],
          medRiskPerms: [],
          lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
          usage: {
            totalSignIns: 21,
            uniqueUsersCount: 2,
            topUsers: [
              { email: 'bob.jones@enterprise.com', count: 14 },
              { email: 'alice.smith@enterprise.com', count: 7 }
            ],
            topDepartments: [
              { name: 'Engineering', count: 21 }
            ]
          }
        },
        {
          appId: '7776f3ab-7ba3-4c90-951a-8e2b83c749ab',
          name: 'Midjourney Discord Bot',
          publisher: 'Midjourney Inc.',
          permissions: ['User.Read'],
          isCertified: false,
          trustScore: 88,
          riskLevel: 'Low',
          highRiskPerms: [],
          medRiskPerms: [],
          lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
          usage: {
            totalSignIns: 18,
            uniqueUsersCount: 3,
            topUsers: [
              { email: 'ethan.hunt@enterprise.com', count: 8 },
              { email: 'fiona.gallagher@enterprise.com', count: 6 },
              { email: 'diana.ross@enterprise.com', count: 4 }
            ],
            topDepartments: [
              { name: 'Marketing', count: 18 }
            ]
          }
        },
        {
          appId: 'ab98fcfc-12bc-4488-8422-c32f83db56c0',
          name: 'Perplexity Research Assistant',
          publisher: 'Perplexity AI',
          permissions: ['User.Read'],
          isCertified: false,
          trustScore: 88,
          riskLevel: 'Low',
          highRiskPerms: [],
          medRiskPerms: [],
          lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
          usage: {
            totalSignIns: 16,
            uniqueUsersCount: 4,
            topUsers: [
              { email: 'helen@enterprise.com', count: 6 },
              { email: 'george.clooney@enterprise.com', count: 4 },
              { email: 'ian.mckellen@enterprise.com', count: 4 }
            ],
            topDepartments: [
              { name: 'HR', count: 10 },
              { name: 'Finance', count: 6 }
            ]
          }
        },
        {
          appId: 'bc789212-00c1-4b11-a678-de31fb4011ea',
          name: 'Synthesia Video Creator',
          publisher: 'Synthesia Ltd',
          permissions: ['User.Read'],
          isCertified: false,
          trustScore: 88,
          riskLevel: 'Low',
          highRiskPerms: [],
          medRiskPerms: [],
          lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
          usage: {
            totalSignIns: 13,
            uniqueUsersCount: 2,
            topUsers: [
              { email: 'fiona.gallagher@enterprise.com', count: 8 },
              { email: 'diana.ross@enterprise.com', count: 5 }
            ],
            topDepartments: [
              { name: 'Marketing', count: 13 }
            ]
          }
        }
      ],
      analytics: {
        topGlobalUsers: [
          { user: 'alice.smith@enterprise.com', count: 66 },
          { user: 'bob.jones@enterprise.com', count: 58 },
          { user: 'diana.ross@enterprise.com', count: 44 },
          { user: 'charlie.brown@enterprise.com', count: 28 },
          { user: 'fiona.gallagher@enterprise.com', count: 26 },
          { user: 'karen.exec@enterprise.com', count: 15 }
        ],
        topGlobalDepts: [
          { dept: 'Engineering', count: 193 },
          { dept: 'Marketing', count: 104 },
          { dept: 'Executive', count: 21 },
          { dept: 'Finance', count: 20 },
          { dept: 'HR', count: 10 }
        ],
        usageOverTime: [
          { date: '2026-05-26', count: 14 },
          { date: '2026-05-27', count: 18 },
          { date: '2026-05-28', count: 22 },
          { date: '2026-05-29', count: 19 },
          { date: '2026-05-30', count: 15 },
          { date: '2026-05-31', count: 12 },
          { date: '2026-06-01', count: 24 },
          { date: '2026-06-02', count: 29 },
          { date: '2026-06-03', count: 32 },
          { date: '2026-06-04', count: 30 },
          { date: '2026-06-08', count: 36 },
          { date: '2026-06-09', count: 40 }
        ]
      },
      allApplications: [], // Will be populated below
      usersUsage: [] // Will be populated below
    };

    const standardApps: AIApp[] = [
      {
        appId: '00000002-0000-0ff1-ce00-000000000000',
        name: 'Microsoft Teams',
        publisher: 'Microsoft Corporation',
        permissions: ['User.Read', 'Directory.Read.All', 'Group.Read.All'],
        isCertified: true,
        isAI: false,
        trustScore: 70,
        riskLevel: 'Medium',
        highRiskPerms: [],
        medRiskPerms: [
          { name: 'Directory.Read.All', desc: 'Read directory data' },
          { name: 'Group.Read.All', desc: 'Read all groups' }
        ],
        lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
        usage: { totalSignIns: 243, uniqueUsersCount: 14, topUsers: [], topDepartments: [] }
      },
      {
        appId: 'c186832e-436c-4861-a5bf-86a02df200a1',
        name: 'Salesforce CRM Integration',
        publisher: 'Salesforce Inc',
        permissions: ['User.Read', 'Contacts.Read', 'Calendars.Read'],
        isCertified: true,
        isAI: false,
        trustScore: 88,
        riskLevel: 'Low',
        highRiskPerms: [],
        medRiskPerms: [],
        lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
        usage: { totalSignIns: 0, uniqueUsersCount: 0, topUsers: [], topDepartments: [] } // Zero usage!
      },
      {
        appId: 'fa17ca21-0a3c-4122-b5e1-9238bc3a5b67',
        name: 'ServiceNow ITSM',
        publisher: 'ServiceNow Inc',
        permissions: ['User.Read', 'Directory.Read.All'],
        isCertified: true,
        isAI: false,
        trustScore: 70,
        riskLevel: 'Medium',
        highRiskPerms: [],
        medRiskPerms: [{ name: 'Directory.Read.All', desc: 'Read directory data' }],
        lowRiskPerms: [{ name: 'User.Read', desc: 'Sign in and read user profile' }],
        usage: { totalSignIns: 0, uniqueUsersCount: 0, topUsers: [], topDepartments: [] } // Zero usage!
      }
    ];

    staticDemo.allApplications = [
      ...staticDemo.aiApplications.map(app => ({ ...app, isAI: true })),
      ...standardApps
    ].sort((a, b) => b.usage.totalSignIns - a.usage.totalSignIns);

    const usersUsage: UserUsage[] = [
      {
        user: 'alice.smith@enterprise.com',
        department: 'Engineering',
        totalSignIns: 66,
        appsUsed: [
          { appId: '148f43ad-2ba8-4c91-9e23-289cfaf2308a', name: 'GitHub Copilot for Business', count: 48, isAI: true },
          { appId: '6438f61a-2258-4521-ba31-893dca9fbe1e', name: 'OpenAI ChatGPT Enterprise', count: 18, isAI: true }
        ]
      },
      {
        user: 'bob.jones@enterprise.com',
        department: 'Engineering',
        totalSignIns: 58,
        appsUsed: [
          { appId: '148f43ad-2ba8-4c91-9e23-289cfaf2308a', name: 'GitHub Copilot for Business', count: 32, isAI: true },
          { appId: 'df4230ba-47bc-4999-a931-15cfcb3a59a9', name: 'v0.dev Frontend Assistant', count: 14, isAI: true },
          { appId: 'ca77bc9a-7b3c-43d1-9bc1-12f7a93cbaef', name: 'Custom Shadow-GPT Connector', count: 12, isAI: true }
        ]
      },
      {
        user: 'diana.ross@enterprise.com',
        department: 'Marketing',
        totalSignIns: 44,
        appsUsed: [
          { appId: '6438f61a-2258-4521-ba31-893dca9fbe1e', name: 'OpenAI ChatGPT Enterprise', count: 22, isAI: true },
          { appId: 'fae8913b-18a8-4444-a901-7fa8623b30ad', name: 'Claude.ai Team Workspace', count: 18, isAI: true },
          { appId: '7776f3ab-7ba3-4c90-951a-8e2b83c749ab', name: 'Midjourney Discord Bot', count: 4, isAI: true }
        ]
      },
      {
        user: 'ethan.hunt@enterprise.com',
        department: 'Marketing',
        totalSignIns: 14,
        appsUsed: [
          { appId: '7776f3ab-7ba3-4c90-951a-8e2b83c749ab', name: 'Midjourney Discord Bot', count: 8, isAI: true },
          { appId: 'ca77bc9a-7b3c-43d1-9bc1-12f7a93cbaef', name: 'Custom Shadow-GPT Connector', count: 6, isAI: true }
        ]
      },
      {
        user: 'fiona.gallagher@enterprise.com',
        department: 'Marketing',
        totalSignIns: 26,
        appsUsed: [
          { appId: 'fae8913b-18a8-4444-a901-7fa8623b30ad', name: 'Claude.ai Team Workspace', count: 12, isAI: true },
          { appId: 'bc789212-00c1-4b11-a678-de31fb4011ea', name: 'Synthesia Video Creator', count: 8, isAI: true },
          { appId: '7776f3ab-7ba3-4c90-951a-8e2b83c749ab', name: 'Midjourney Discord Bot', count: 6, isAI: true }
        ]
      }
    ];

    staticDemo.usersUsage = usersUsage;

    setResults(staticDemo);
    setActiveTab('dashboard');
  };

  // CSV Export helper function
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export full application registrations table as CSV
  const exportAppsToCSV = () => {
    if (!results) return;
    const headers = ['Application ID', 'Name', 'Publisher', 'App Type', 'Activity Status', 'Total Logins', 'Unique Users', 'Trust Score', 'Risk Level'];
    const rows = results.allApplications.map(app => [
      app.appId,
      app.name,
      app.publisher,
      app.isAI ? 'AI Workload' : 'Standard Tool',
      app.usage.totalSignIns === 0 ? 'Unused' : 'Active',
      app.usage.totalSignIns.toString(),
      app.usage.uniqueUsersCount.toString(),
      app.trustScore.toString(),
      app.riskLevel
    ]);
    downloadCSV('entra_applications_directory_audit.csv', headers, rows);
  };

  // Export user interaction directory as CSV
  const exportUsersToCSV = () => {
    if (!results) return;
    const headers = ['User Principal Name', 'Department', 'Total Logins', 'Applications Accessed'];
    const rows = results.usersUsage.map(user => [
      user.user,
      user.department,
      user.totalSignIns.toString(),
      user.appsUsed.map(app => `${app.name} (${app.count} logins${app.isAI ? ', AI' : ''})`).join('; ')
    ]);
    downloadCSV('entra_user_telemetry_directory.csv', headers, rows);
  };

  // Export complete results as a shareable JSON bundle
  const exportFullJSONBundle = () => {
    if (!results) return;
    const jsonContent = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'entra_ai_audit_bundled_report.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load a previously exported JSON bundle
  const handleLoadJSONReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonFile) return;
    
    setIsAnalyzing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.summary && parsed.aiApplications && parsed.allApplications && parsed.usersUsage) {
          setResults(parsed);
          setActiveTab('dashboard');
        } else {
          setError('Invalid JSON Audit file format. Please upload a report generated by this tool.');
        }
      } catch (err) {
        setError('Failed to parse JSON file.');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsText(jsonFile);
  };

  // Handle Form Submission / CSV Upload
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appsFile) {
      setError('Please select an App Registrations CSV file.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('appsCsv', appsFile);
    if (signinsFile) {
      formData.append('signinsCsv', signinsFile);
    }

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fail to analyze data');
      }

      const data = await response.json();
      setResults(data);
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error processing files. Please make sure the CSV files are valid.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Drag and drop helper
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, setFile: (file: File) => void) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // Filtering Logic
  const filteredApps = results?.aiApplications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.appId.includes(searchQuery);
    
    const matchesRisk = riskFilter === 'All' || app.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  }) || [];

  // Reset the dashboard data
  const handleReset = () => {
    setResults(null);
    setAppsFile(null);
    setSigninsFile(null);
    setSelectedApp(null);
    setError(null);
  };

  return (
    <div className="app-container">
      {/* HEADER NAVBAR */}
      <header className="main-navbar">
        <div className="logo-section">
          <div className="logo-orb">
            <Sparkles size={18} className="spark-icon" />
          </div>
          <div className="logo-text">
            <h2>AI Risk & Usage Reporter</h2>
            <p>Microsoft Entra ID Shadow AI Auditing</p>
          </div>
        </div>

        <div className="navbar-actions">
          {/* Server status indicator */}
          <span className={`status-badge ${serverOnline ? 'online' : 'offline'}`}>
            <span className="pulse-dot"></span>
            {serverOnline ? 'Backend Online' : 'Local Mode Fallback'}
          </span>

          {results ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} className="no-print">
              <button className="btn-accent" style={{ background: 'linear-gradient(90deg, #10b981, #059669)', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }} onClick={exportFullJSONBundle}>
                Export JSON Bundle
              </button>
              <button className="btn-secondary" onClick={() => window.print()}>
                Export PDF Report
              </button>
              <button className="btn-secondary outline" onClick={handleReset}>
                Upload New Data
              </button>
            </div>
          ) : (
            <button className="btn-accent" onClick={handleLoadDemo} disabled={isAnalyzing}>
              <Activity size={15} style={{ marginRight: '6px' }} />
              Load Interactive Demo
            </button>
          )}
        </div>
      </header>

      <main className="content-area">
        {/* ERROR DISPLAY */}
        {error && (
          <div className="error-alert">
            <ShieldAlert size={20} className="error-icon" />
            <div className="error-message">
              <h4>Analysis Failed</h4>
              <p>{error}</p>
            </div>
            <button className="close-btn" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* ================================================================= */}
        {/* FILE UPLOAD & ONBOARDING PHASE */}
        {/* ================================================================= */}
        {!results && (
          <div className="onboarding-container">
            <div className="onboarding-grid">
              {/* Left Side: Upload Panel */}
              <div className="panel upload-panel">
                <div className="panel-header">
                  <Database size={20} className="panel-icon header-purple" />
                  <div>
                    <h3>Analyze New Datasets</h3>
                    <p>Provide exports from Microsoft Entra ID to analyze</p>
                  </div>
                </div>

                <form onSubmit={handleAnalyze} className="upload-form">
                  {/* File 1: Apps */}
                  <div className="form-group">
                    <label className="field-label mandatory">
                      <span>1. Registered Applications CSV</span>
                      <span className="tooltip" title="Export from Entra ID > App Registrations > All Applications">
                        <Info size={14} />
                      </span>
                    </label>
                    <div 
                      className={`drag-drop-zone ${appsFile ? 'has-file' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, setAppsFile)}
                    >
                      <input 
                        type="file" 
                        id="apps-file-input" 
                        accept=".csv"
                        className="file-input-hidden"
                        onChange={(e) => e.target.files && setAppsFile(e.target.files[0])}
                      />
                      <label htmlFor="apps-file-input" className="drag-drop-content">
                        <FileSpreadsheet className="file-icon" size={32} />
                        {appsFile ? (
                          <div className="file-details">
                            <span className="file-name">{appsFile.name}</span>
                            <span className="file-size">{(appsFile.size / 1024).toFixed(1)} KB</span>
                          </div>
                        ) : (
                          <div>
                            <span className="drag-action">Click to browse</span> or drag and drop Entra Apps CSV
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* File 2: Sign-Ins */}
                  <div className="form-group">
                    <label className="field-label">
                      <span>2. Sign-In Logs CSV (Optional)</span>
                      <span className="tooltip" title="Export from Entra ID > Sign-in logs. Required to find top users and department usage.">
                        <Info size={14} />
                      </span>
                    </label>
                    <div 
                      className={`drag-drop-zone ${signinsFile ? 'has-file' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, setSigninsFile)}
                    >
                      <input 
                        type="file" 
                        id="signins-file-input" 
                        accept=".csv"
                        className="file-input-hidden"
                        onChange={(e) => e.target.files && setSigninsFile(e.target.files[0])}
                      />
                      <label htmlFor="signins-file-input" className="drag-drop-content">
                        <Activity className="file-icon" size={32} />
                        {signinsFile ? (
                          <div className="file-details">
                            <span className="file-name">{signinsFile.name}</span>
                            <span className="file-size">{(signinsFile.size / 1024).toFixed(1)} KB</span>
                          </div>
                        ) : (
                          <div>
                            <span className="drag-action">Click to browse</span> or drag and drop Sign-In logs CSV
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn-accent btn-large w-full"
                      disabled={isAnalyzing || !appsFile}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="spinner"></span>
                          Analyzing CSV Datasets...
                        </>
                      ) : (
                        <>
                          Run Audit Analysis
                          <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                  <span style={{ padding: '0 10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                </div>

                {/* Form 2: Shareable JSON Bundle Upload */}
                <form onSubmit={handleLoadJSONReport} className="upload-form">
                  <div className="form-group">
                    <label className="field-label">
                      <span>Import Shareable JSON Report Bundle</span>
                      <span className="tooltip" title="Upload a .json report file previously generated and exported by this tool to instantly load the full interactive dashboard.">
                        <Info size={14} />
                      </span>
                    </label>
                    <div 
                      className={`drag-drop-zone ${jsonFile ? 'has-file' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, setJsonFile)}
                      style={{ padding: '22px 14px' }}
                    >
                      <input 
                        type="file" 
                        id="json-file-input" 
                        accept=".json"
                        className="file-input-hidden"
                        onChange={(e) => e.target.files && setJsonFile(e.target.files[0])}
                      />
                      <label htmlFor="json-file-input" className="drag-drop-content">
                        <Database className="file-icon" size={24} style={{ color: jsonFile ? 'var(--green-risk)' : 'var(--text-muted)' }} />
                        {jsonFile ? (
                          <div className="file-details">
                            <span className="file-name" style={{ color: 'var(--green-risk)' }}>{jsonFile.name}</span>
                            <span className="file-size">{(jsonFile.size / 1024).toFixed(1)} KB</span>
                          </div>
                        ) : (
                          <div>
                            <span className="drag-action" style={{ color: 'var(--green-risk)' }}>Load shareable bundle</span> or drag & drop report .json
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn-accent btn-large w-full"
                      disabled={isAnalyzing || !jsonFile}
                      style={{ background: 'linear-gradient(90deg, #10b981, #059669)', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="spinner"></span>
                          Loading JSON Bundle...
                        </>
                      ) : (
                        <>
                          Import Bundled Report
                          <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side: Educational Information */}
              <div className="info-panel-section">
                <div className="hero-banner-accent">
                  <Sparkles size={24} className="banner-spark" />
                  <div className="banner-text">
                    <h3>Enterprise AI Transparency</h3>
                    <p>Unmask unauthorized AI usage (Shadow AI), identify insecure API integrations, and secure organizational data before it leaks.</p>
                  </div>
                </div>

                <div className="onboarding-guide panel">
                  <div className="onboarding-guide-header" onClick={() => setShowHowToExport(!showHowToExport)}>
                    <HelpCircle size={18} className="guide-icon" />
                    <span>How to export logs from Microsoft Entra (Azure AD)?</span>
                    <ChevronRight size={18} className={`chevron ${showHowToExport ? 'rotated' : ''}`} />
                  </div>
                  
                  {showHowToExport && (
                    <div className="guide-steps animate-slide-down">
                      <div className="guide-step">
                        <div className="step-num">1</div>
                        <div className="step-text">
                          <h5>Export Registered Applications</h5>
                          <p>Sign in to <strong>Microsoft Entra Admin Center</strong>. Go to <strong>Identity &gt; Applications &gt; App Registrations</strong>. Click <strong>All Applications</strong> tab, then click the <strong>Export as CSV</strong> button at the top.</p>
                        </div>
                      </div>
                      <div className="guide-step">
                        <div className="step-num">2</div>
                        <div className="step-text">
                          <h5>Export User Sign-In Logs</h5>
                          <p>Go to <strong>Identity &gt; Monitoring & Health &gt; Sign-in logs</strong>. Filter for user sign-ins, and click <strong>Download &gt; Export as CSV</strong>.</p>
                        </div>
                      </div>
                      <div className="guide-step-tip">
                        <strong>💡 Note:</strong> Sign-In Logs are recommended to unlock the "Usage Stats" and find out exactly which employees and departments are running which AI services.
                      </div>
                    </div>
                  )}
                </div>

                <div className="risk-scale panel">
                  <h4>How Trust Values are Determined</h4>
                  <p className="subtext">We analyze individual requested API scopes (permissions) and rate them based on corporate risk profiles:</p>
                  
                  <div className="risk-level-indicators">
                    <div className="risk-ind-item">
                      <span className="ind-badge risk-high">High Risk Scopes</span>
                      <p>Scopes allowing write/modify access to files, emails, calendars, or directory objects (e.g. <code>Files.ReadWrite.All</code>, <code>Directory.ReadWrite.All</code>).</p>
                    </div>
                    <div className="risk-ind-item">
                      <span className="ind-badge risk-medium">Medium Risk Scopes</span>
                      <p>Scopes granting broad read-only access to corporate files, directories, or emails (e.g. <code>Files.Read.All</code>, <code>Directory.Read.All</code>).</p>
                    </div>
                    <div className="risk-ind-item">
                      <span className="ind-badge risk-low">Low Risk Scopes</span>
                      <p>Standard permissions granting sign-in, basic identity details, and individual email reading (e.g. <code>User.Read</code>, <code>profile</code>).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* CORE REPORT PHASE (DASHBOARD VIEWS) */}
        {/* ================================================================= */}
        {results && (
          <div className="dashboard-content animate-fade-in">
            {/* 1. TOP STATS GRID */}
            <div className="stats-grid">
              {/* Stat 1 */}
              <div className="stat-card">
                <div className="stat-icon-wrapper purple">
                  <Layers size={20} />
                </div>
                <div className="stat-data">
                  <span className="stat-val">{results.summary.totalAppsScanned}</span>
                  <span className="stat-lbl">Apps Scanned</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="stat-card">
                <div className="stat-icon-wrapper ai-sparkle">
                  <Sparkles size={20} />
                </div>
                <div className="stat-data">
                  <span className="stat-val text-accent">{results.summary.totalAiAppsFound}</span>
                  <span className="stat-lbl">AI Tools Found</span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="stat-card">
                <div className={`stat-icon-wrapper risk-${results.summary.overallSecurityPosture.toLowerCase()}`}>
                  {results.summary.overallSecurityPosture === 'Good' ? (
                    <ShieldCheck size={20} />
                  ) : (
                    <ShieldAlert size={20} />
                  )}
                </div>
                <div className="stat-data">
                  <span className={`stat-val risk-${results.summary.overallSecurityPosture.toLowerCase()}`}>
                    {results.summary.averageRiskScore}%
                  </span>
                  <span className="stat-lbl">Avg. Security Threat (Posture: {results.summary.overallSecurityPosture})</span>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="stat-card">
                <div className="stat-icon-wrapper blue">
                  <Users size={20} />
                </div>
                <div className="stat-data">
                  <span className="stat-val">{results.summary.totalSignInsAcrossAiApps}</span>
                  <span className="stat-lbl">Total AI Sign-Ins Detected</span>
                </div>
              </div>
            </div>

            {/* TAB CONTROLS */}
            <div className="tab-bar">
              <button 
                className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart3 size={16} />
                Usage Analytics
              </button>
              <button 
                className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users size={16} />
                App Use by User
              </button>
              <button 
                className={`tab-btn ${activeTab === 'risk' ? 'active' : ''}`}
                onClick={() => setActiveTab('risk')}
              >
                <Shield size={16} />
                AI Risk Profiles
                <span className="badge-count-red">{results.aiApplications.filter(a => a.riskLevel === 'High').length}</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <FileSpreadsheet size={16} />
                All Applications Scanned
              </button>
              <button 
                className={`tab-btn ${activeTab === 'marked' ? 'active' : ''}`}
                onClick={() => setActiveTab('marked')}
              >
                <ShieldCheck size={16} />
                Marked Apps
                {(() => {
                  const markedCount = new Set([...Object.keys(userAIMarks), ...Array.from(markedForRemoval)]).size;
                  if (markedCount > 0) return <span className="badge-count-red">{markedCount}</span>;
                  return null;
                })()}
              </button>
            </div>

            {/* =============================================================== */}
            {/* TAB 1: DETAILED USAGE ANALYTICS */}
            {/* =============================================================== */}
            {activeTab === 'dashboard' && (
              <div className="analytics-tab-view animate-fade-in">
                {results.summary.totalSignInsAcrossAiApps === 0 ? (
                  <div className="no-usage-box panel">
                    <Activity size={40} className="disabled-icon" />
                    <h4>No Usage Logs Provided</h4>
                    <p>To view deep usage analytics (top users, department charts, daily activity), upload user Sign-In Logs CSV alongside the application registration CSV.</p>
                  </div>
                ) : (
                  <>
                    <div className="analytics-row-top">
                      {/* Left: Top AI Apps Bar Chart */}
                      <div className="panel chart-panel flex-2">
                        <div className="panel-header-simple">
                          <h4>Top AI Applications by Usage</h4>
                          <p>Sign-in count share across analyzed AI services</p>
                        </div>
                        <div className="bar-chart-container">
                          {results.aiApplications.slice(0, 5).map((app, idx) => {
                            const maxVal = Math.max(...results.aiApplications.map(a => a.usage.totalSignIns));
                            const percentage = maxVal > 0 ? (app.usage.totalSignIns / maxVal) * 100 : 0;
                            return (
                              <div className="chart-bar-row" key={app.appId}>
                                <div className="bar-label">
                                  <span className="bar-index">#{idx + 1}</span>
                                  <span className="bar-name">{app.name}</span>
                                </div>
                                <div className="bar-track-wrapper">
                                  <div className="bar-track">
                                    <div 
                                      className={`bar-fill fill-gradient-${app.riskLevel.toLowerCase()}`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="bar-count-val">{app.usage.totalSignIns} sign-ins</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Department Share */}
                      <div className="panel chart-panel flex-1">
                        <div className="panel-header-simple">
                          <h4>Department Usage Share</h4>
                          <p>Which divisions are accessing AI tools</p>
                        </div>
                        <div className="pie-alternative-list">
                          {results.analytics.topGlobalDepts.map((dept, idx) => {
                            const totalVal = results.analytics.topGlobalDepts.reduce((acc, curr) => acc + curr.count, 0);
                            const percent = totalVal > 0 ? Math.round((dept.count / totalVal) * 100) : 0;
                            return (
                              <div className="pie-list-item" key={dept.dept}>
                                <div className="pie-item-header">
                                  <div className="pie-item-color-indicator" style={{ backgroundColor: `hsl(${260 - (idx * 30)}, 70%, 65%)` }}></div>
                                  <span className="pie-item-name">{dept.dept}</span>
                                </div>
                                <div className="pie-item-details">
                                  <span className="pie-count">{dept.count} calls</span>
                                  <span className="pie-percent">{percent}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="analytics-row-bottom">
                      {/* Left: Top Users list */}
                      <div className="panel list-panel flex-1">
                        <div className="panel-header-simple">
                          <h4>Top Active AI Users</h4>
                          <p>Employees interacting most with AI workloads</p>
                        </div>
                        <div className="user-leaderboard">
                          {results.analytics.topGlobalUsers.slice(0, 5).map((user, idx) => (
                            <div className="leaderboard-item" key={user.user}>
                              <div className="user-avatar-badge" style={{ backgroundColor: `hsl(${(idx * 60) % 360}, 60%, 45%)` }}>
                                {user.user.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="user-lead-info">
                                <span className="user-lead-email">{user.user}</span>
                                <span className="user-lead-dept">
                                  {results.aiApplications.find(a => a.usage.topUsers.some(u => u.email === user.user))?.usage.topDepartments[0]?.name || 'Staff'}
                                </span>
                              </div>
                              <div className="user-lead-val">
                                <strong>{user.count}</strong> sign-ins
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Daily activity trend */}
                      <div className="panel chart-panel flex-2">
                        <div className="panel-header-simple">
                          <h4>Daily AI Usage Timeline</h4>
                          <p>Interactions with AI platforms over the past 14 days</p>
                        </div>
                        <div className="timeline-chart">
                          {results.analytics.usageOverTime.map((pt) => {
                            const maxVal = Math.max(...results.analytics.usageOverTime.map(u => u.count));
                            const height = maxVal > 0 ? (pt.count / maxVal) * 100 : 0;
                            const formattedDate = pt.date.substring(5); // MM-DD
                            return (
                              <div className="timeline-bar-col" key={pt.date}>
                                <div className="timeline-bar-wrapper">
                                  <div className="timeline-hover-val">{pt.count}</div>
                                  <div className="timeline-bar-track">
                                    <div 
                                      className="timeline-bar-fill"
                                      style={{ height: `${height}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <span className="timeline-label">{formattedDate}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 4: APP USE BY USER */}
            {/* =============================================================== */}
            {activeTab === 'users' && (
              <div className="users-tab-view panel animate-fade-in">
                <div className="panel-header-simple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ margin: 0 }}>User Interaction Directory</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Browse active directory users, their department, total logins, and every application they have authenticated with.</p>
                  </div>
                  <button className="btn-secondary btn-sm no-print" onClick={exportUsersToCSV}>
                    Export Users CSV
                  </button>
                </div>

                {/* Filter / Search Bar */}
                <div className="filter-panel" style={{ marginBottom: '24px', background: '#171d24', border: '1px solid var(--border-color)', padding: '12px 18px', borderRadius: 'var(--radius-md)' }}>
                  <div className="search-group flex-2">
                    <Search size={18} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search users by email, domain, or department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-field"
                    />
                  </div>
                </div>

                {/* Users List */}
                <div className="users-usage-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(results.usersUsage || []).filter(item => 
                    item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.department.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                    <div className="no-results" style={{ padding: '40px', textAlign: 'center' }}>
                      <Users size={40} className="disabled-icon" />
                      <h4>No Users Match Criteria</h4>
                      <p>Adjust your search query to find directory members.</p>
                    </div>
                  ) : (
                    (results.usersUsage || []).filter(item => 
                      item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.department.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(item => (
                      <div className="user-usage-row-card" key={item.user} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', backgroundColor: '#171d24', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                        {/* User Profile Summary */}
                        <div className="user-prof-col" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', borderRight: '1px solid var(--border-color)', paddingRight: '20px' }}>
                          <div className="user-avatar-badge" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                            {item.user.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="user-meta-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', overflow: 'hidden' }}>
                            <h5 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: '700', wordBreak: 'break-all' }}>{item.user}</h5>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dept: <strong>{item.department}</strong></span>
                            <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: '600', marginTop: '6px' }}>
                              Total Logins: {item.totalSignIns}
                            </span>
                          </div>
                        </div>

                        {/* Applications Accessed */}
                        <div className="user-apps-col" style={{ textAlign: 'left' }}>
                          <h6 style={{ margin: '0 0 12px 0', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>Applications Accessed ({item.appsUsed.length})</h6>
                          <div className="app-tags-cloud" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {item.appsUsed.map(app => (
                              <div 
                                className="app-tag-badge" 
                                key={app.appId} 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '6px', 
                                  padding: '6px 12px', 
                                  borderRadius: '20px', 
                                  fontSize: '12px', 
                                  fontWeight: '600',
                                  border: '1px solid',
                                  backgroundColor: app.isAI ? 'rgba(168, 85, 247, 0.12)' : 'rgba(59, 130, 246, 0.1)',
                                  borderColor: app.isAI ? 'rgba(168, 85, 247, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                                  color: app.isAI ? '#c084fc' : '#60a5fa'
                                }}
                              >
                                {app.isAI && <Sparkles size={11} style={{ flexShrink: 0 }} />}
                                <span>{app.name}</span>
                                <span style={{ 
                                  backgroundColor: 'rgba(255,255,255,0.06)', 
                                  padding: '1px 6px', 
                                  borderRadius: '10px', 
                                  fontSize: '10px', 
                                  color: '#fff', 
                                  marginLeft: '4px' 
                                }}>
                                  {app.count} logins
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 2: AI RISK PROFILES */}
            {/* =============================================================== */}
            {activeTab === 'risk' && (
              <div className="risk-profiles-tab animate-fade-in">
                {/* FILTER CONTROLS */}
                <div className="filter-panel panel">
                  <div className="search-group flex-2">
                    <Search size={18} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search AI application, developer, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-field"
                    />
                  </div>

                  <div className="filter-group flex-1">
                    <label>Threat Tier:</label>
                    <select 
                      value={riskFilter} 
                      onChange={(e) => setRiskFilter(e.target.value as any)}
                      className="filter-select"
                    >
                      <option value="All">All Severity Levels</option>
                      <option value="High">High Severity (Scores &lt; 60)</option>
                      <option value="Medium">Medium Severity (Scores 60-79)</option>
                      <option value="Low">Low Severity (Scores 80+)</option>
                    </select>
                  </div>
                </div>

                {filteredApps.length === 0 ? (
                  <div className="no-results panel">
                    <ShieldAlert size={40} className="disabled-icon" />
                    <h4>No Applications Match Filters</h4>
                    <p>Adjust your search query or threat tier criteria.</p>
                  </div>
                ) : (
                  <div className="risk-cards-grid">
                    {filteredApps.map(app => {
                      const ratingColor = app.riskLevel === 'High' ? 'red' : app.riskLevel === 'Medium' ? 'yellow' : 'green';
                      return (
                        <div className={`app-risk-card ${app.riskLevel.toLowerCase()}`} key={app.appId}>
                          <div className="risk-card-top">
                            <div className={`risk-orb-badge ${ratingColor}`}>
                              {app.riskLevel} Risk
                            </div>
                            <div className="score-circle-indicator">
                              <span className="sc-val">{app.trustScore}</span>
                              <span className="sc-lbl">Trust</span>
                            </div>
                          </div>

                          <div className="risk-card-body">
                            <h4 className="app-card-title">{app.name}</h4>
                            <p className="app-card-publisher">By {app.publisher}</p>
                            
                            <div className="permissions-summary-tag">
                              <span>Permissions: </span>
                              <strong>{app.permissions.length}</strong> scopes requested
                            </div>

                            {app.highRiskPerms.length > 0 && (
                              <div className="critical-warning-banner">
                                <ShieldAlert size={14} />
                                <span>{app.highRiskPerms.length} High Risk Permissions</span>
                              </div>
                            )}

                            {app.usage.totalSignIns > 0 && (
                              <div className="card-usage-stat">
                                <Activity size={13} />
                                <span>Used <strong>{app.usage.totalSignIns}</strong> times by <strong>{app.usage.uniqueUsersCount}</strong> users</span>
                              </div>
                            )}
                          </div>

                          <div className="risk-card-footer">
                            <button 
                              className={`btn-primary btn-sm ${ratingColor === 'red' ? 'danger' : ratingColor === 'yellow' ? 'warning' : 'success'}`}
                              onClick={() => setSelectedApp(app)}
                            >
                              Audit Permissions
                              <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 3: ALL APPLICATIONS LIST */}
            {/* =============================================================== */}
            {activeTab === 'all' && (
              <div className="all-apps-tab panel animate-fade-in">
                <div className="panel-header-simple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ margin: 0 }}>All Registered Applications Scanned</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Audit of all application integrations in the directory to identify unused services and potential security threats.</p>
                  </div>
                  <button className="btn-secondary btn-sm no-print" onClick={exportAppsToCSV}>
                    Export Applications CSV
                  </button>
                </div>

                <div className="filter-panel" style={{ marginBottom: '24px', background: '#171d24', border: '1px solid var(--border-color)', padding: '12px 18px', borderRadius: 'var(--radius-md)' }}>
                  <div className="search-group flex-2">
                    <Search size={18} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search applications by name or publisher..."
                      value={allAppsSearch}
                      onChange={(e) => setAllAppsSearch(e.target.value)}
                      className="search-field"
                    />
                  </div>
                  <div className="filter-group flex-1">
                    <label>App Type:</label>
                    <select value={allAppsFilter} onChange={(e) => setAllAppsFilter(e.target.value as any)} className="filter-select">
                      <option value="All">All Types</option>
                      <option value="AI">AI Workloads Only</option>
                      <option value="Standard">Standard Tools Only</option>
                    </select>
                  </div>
                  <div className="filter-group flex-1">
                    <label>Sort By:</label>
                    <select value={allAppsSort} onChange={(e) => setAllAppsSort(e.target.value as any)} className="filter-select">
                      <option value="SignIns">Total Sign-ins</option>
                      <option value="Name">Application Name</option>
                      <option value="RiskLevel">Risk Level</option>
                      <option value="TrustScore">Trust Score</option>
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Application Name</th>
                        <th>Publisher</th>
                        <th style={{ textAlign: 'center' }}>App Type</th>
                        <th style={{ textAlign: 'center' }}>Activity Status</th>
                        <th style={{ textAlign: 'center' }}>Total Sign-ins</th>
                        <th style={{ textAlign: 'center' }}>Unique Users</th>
                        <th style={{ textAlign: 'center' }}>Trust Score</th>
                        <th style={{ textAlign: 'center' }}>Risk Rating</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.allApplications
                        .filter(app => {
                           const matchesSearch = app.name.toLowerCase().includes(allAppsSearch.toLowerCase()) || 
                                                 app.publisher.toLowerCase().includes(allAppsSearch.toLowerCase());
                           if (!matchesSearch) return false;
                           const effectiveAI = getAppEffectiveIsAI(app);
                           if (allAppsFilter === 'AI' && !effectiveAI) return false;
                           if (allAppsFilter === 'Standard' && effectiveAI) return false;
                           return true;
                        })
                        .sort((a, b) => {
                           if (allAppsSort === 'SignIns') return b.usage.totalSignIns - a.usage.totalSignIns;
                           if (allAppsSort === 'Name') return a.name.localeCompare(b.name);
                           if (allAppsSort === 'TrustScore') return a.trustScore - b.trustScore;
                           if (allAppsSort === 'RiskLevel') {
                               const rMap = { High: 3, Medium: 2, Low: 1 };
                               return rMap[b.riskLevel] - rMap[a.riskLevel];
                           }
                           return 0;
                        })
                        .map(app => {
                          const effectiveAI = getAppEffectiveIsAI(app);
                          return (
                        <tr key={app.appId}>
                          <td className="font-bold">{app.name}</td>
                          <td>{app.publisher}</td>
                          <td style={{ textAlign: 'center' }}>
                            {effectiveAI ? (
                              <span className="badge-tag shadow" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>AI Workload</span>
                            ) : (
                              <span className="badge-tag certified" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>Standard Tool</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {app.usage.totalSignIns === 0 ? (
                              <span className="risk-badge-tag high" style={{ fontWeight: '700' }}>Unused (No Logins)</span>
                            ) : (
                              <span className="risk-badge-tag low" style={{ fontWeight: '700' }}>Active ({app.usage.uniqueUsersCount} users)</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>{app.usage.totalSignIns}</td>
                          <td style={{ textAlign: 'center' }}>{app.usage.uniqueUsersCount}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="table-score-badge">
                              <strong>{app.trustScore}</strong>/100
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`risk-badge-tag ${app.riskLevel.toLowerCase()}`}>
                              {app.riskLevel} Risk
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button className="btn-secondary btn-xs" onClick={() => setSelectedApp(app)}>
                                Details
                              </button>
                              <button className={`btn-secondary btn-xs ${effectiveAI ? 'outline' : ''}`} onClick={() => setUserAIMarks(p => ({ ...p, [app.appId]: !effectiveAI }))}>
                                {effectiveAI ? 'Unmark AI' : 'Mark AI'}
                              </button>
                              <button className={`btn-secondary btn-xs ${markedForRemoval.has(app.appId) ? 'danger' : ''}`} onClick={() => toggleMarkForRemoval(app.appId)}>
                                {markedForRemoval.has(app.appId) ? 'Unmark Removal' : 'Mark Removal'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 5: MARKED APPS LIST */}
            {/* =============================================================== */}
            {activeTab === 'marked' && (
              <div className="all-apps-tab panel animate-fade-in">
                <div className="panel-header-simple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ margin: 0 }}>Marked Applications</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Applications that have been manually marked as AI or flagged for removal.</p>
                  </div>
                  <button className="btn-secondary btn-sm no-print" onClick={exportMarkedToCSV}>
                    Export Marked CSV
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Application Name</th>
                        <th>Publisher</th>
                        <th style={{ textAlign: 'center' }}>Manual App Type</th>
                        <th style={{ textAlign: 'center' }}>Marked For Removal</th>
                        <th style={{ textAlign: 'center' }}>Total Sign-ins</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.allApplications
                        .filter(app => userAIMarks[app.appId] !== undefined || markedForRemoval.has(app.appId))
                        .map(app => {
                          const effectiveAI = getAppEffectiveIsAI(app);
                          return (
                        <tr key={`marked-${app.appId}`}>
                          <td className="font-bold">{app.name}</td>
                          <td>{app.publisher}</td>
                          <td style={{ textAlign: 'center' }}>
                            {effectiveAI ? (
                              <span className="badge-tag shadow" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>AI Workload</span>
                            ) : (
                              <span className="badge-tag certified" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>Standard Tool</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {markedForRemoval.has(app.appId) ? (
                              <span className="risk-badge-tag high" style={{ fontWeight: '700' }}>Flagged</span>
                            ) : (
                              <span className="risk-badge-tag low" style={{ fontWeight: '700' }}>No</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>{app.usage.totalSignIns}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button className="btn-secondary btn-xs" onClick={() => setSelectedApp(app)}>
                                Details
                              </button>
                              <button className={`btn-secondary btn-xs ${effectiveAI ? 'outline' : ''}`} onClick={() => setUserAIMarks(p => ({ ...p, [app.appId]: !effectiveAI }))}>
                                {effectiveAI ? 'Unmark AI' : 'Mark AI'}
                              </button>
                              <button className={`btn-secondary btn-xs ${markedForRemoval.has(app.appId) ? 'danger' : ''}`} onClick={() => toggleMarkForRemoval(app.appId)}>
                                {markedForRemoval.has(app.appId) ? 'Unmark Removal' : 'Mark Removal'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                  {results.allApplications.filter(app => userAIMarks[app.appId] !== undefined || markedForRemoval.has(app.appId)).length === 0 && (
                    <div className="no-results" style={{ padding: '40px', textAlign: 'center' }}>
                      <p>No applications have been manually marked yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: APPLICATION PERMISSION DETAIL AUDIT */}
        {/* ================================================================= */}
        {selectedApp && (
          <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
            <div className="modal-box animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-header-top">
                    <h3>{selectedApp.name}</h3>
                    <span className={`risk-badge-tag ${selectedApp.riskLevel.toLowerCase()}`} style={{ marginLeft: '12px' }}>
                      {selectedApp.riskLevel} Risk (Trust: {selectedApp.trustScore}/100)
                    </span>
                  </div>
                  <p className="subtext">Application ID: <code>{selectedApp.appId}</code> | Publisher: {selectedApp.publisher}</p>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedApp(null)}>×</button>
              </div>

              <div className="modal-body-scroll">
                <div className="modal-grid">
                  {/* Left column: Permissions Breakdown */}
                  <div className="modal-left flex-3">
                    <h4 className="section-title-icon border-bottom">
                      <Shield size={16} />
                      Microsoft Graph Scopes Audit
                    </h4>

                    {/* High Risk Perms */}
                    {selectedApp.highRiskPerms.length > 0 && (
                      <div className="risk-audit-group">
                        <div className="risk-audit-group-header text-red">
                          <ShieldAlert size={16} />
                          <h5>High Severity Permissions ({selectedApp.highRiskPerms.length})</h5>
                        </div>
                        <ul className="risk-permissions-list">
                          {selectedApp.highRiskPerms.map(p => (
                            <li key={p.name} className="p-item border-red">
                              <code>{p.name}</code>
                              <p className="p-desc">{p.desc}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Medium Risk Perms */}
                    {selectedApp.medRiskPerms.length > 0 && (
                      <div className="risk-audit-group">
                        <div className="risk-audit-group-header text-yellow">
                          <Info size={16} />
                          <h5>Medium Severity Permissions ({selectedApp.medRiskPerms.length})</h5>
                        </div>
                        <ul className="risk-permissions-list">
                          {selectedApp.medRiskPerms.map(p => (
                            <li key={p.name} className="p-item border-yellow">
                              <code>{p.name}</code>
                              <p className="p-desc">{p.desc}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Low Risk Perms */}
                    {selectedApp.lowRiskPerms.length > 0 && (
                      <div className="risk-audit-group">
                        <div className="risk-audit-group-header text-green">
                          <ShieldCheck size={16} />
                          <h5>Low Severity Permissions ({selectedApp.lowRiskPerms.length})</h5>
                        </div>
                        <ul className="risk-permissions-list">
                          {selectedApp.lowRiskPerms.map(p => (
                            <li key={p.name} className="p-item border-green">
                              <code>{p.name}</code>
                              <p className="p-desc">{p.desc}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedApp.permissions.length === 0 && (
                      <div className="empty-perms-alert">
                        This application has no Microsoft Graph permissions registered in the exported CSV.
                      </div>
                    )}
                  </div>

                  {/* Right column: Usage Analysis */}
                  <div className="modal-right flex-2">
                    <h4 className="section-title-icon border-bottom">
                      <Users size={16} />
                      Application Usage Audit
                    </h4>

                    {selectedApp.usage.totalSignIns === 0 ? (
                      <div className="modal-no-usage">
                        <p>No usage data was parsed for this application. Please upload sign-in logs to track interactive sessions.</p>
                      </div>
                    ) : (
                      <div className="modal-usage-stats">
                        <div className="usage-metric-pill">
                          <div className="pill-item">
                            <span className="p-val">{selectedApp.usage.totalSignIns}</span>
                            <span className="p-lbl">Sign-Ins</span>
                          </div>
                          <div className="pill-item border-left">
                            <span className="p-val">{selectedApp.usage.uniqueUsersCount}</span>
                            <span className="p-lbl">Users</span>
                          </div>
                        </div>

                        {/* Top Departments */}
                        <div className="modal-stat-section">
                          <h5>Division Participation</h5>
                          <ul className="modal-bar-list">
                            {selectedApp.usage.topDepartments.map((dept, idx) => {
                              const total = selectedApp.usage.totalSignIns;
                              const widthPct = total > 0 ? (dept.count / total) * 100 : 0;
                              return (
                                <li className="modal-bar-item" key={dept.name}>
                                  <div className="mbi-meta">
                                    <span className="mbi-name">{dept.name}</span>
                                    <span className="mbi-count">{dept.count} calls</span>
                                  </div>
                                  <div className="mbi-track">
                                    <div className="mbi-fill" style={{ width: `${widthPct}%`, backgroundColor: `hsl(${260 - (idx * 40)}, 65%, 55%)` }}></div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {/* Top Users list */}
                        <div className="modal-stat-section" style={{ marginTop: '20px' }}>
                          <h5>Top Active Consumers</h5>
                          <ul className="modal-user-list">
                            {selectedApp.usage.topUsers.map(user => (
                              <li className="modal-user-item" key={user.email}>
                                <span className="mui-email">{user.email}</span>
                                <span className="mui-count">{user.count} sessions</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setSelectedApp(null)}>Close Audit Log</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="main-footer">
        <p>© 2026 AI Risk & Usage Reporter | Engineered for Microsoft Entra ID Cybersecurity</p>
      </footer>
    </div>
  );
}

export default App;
