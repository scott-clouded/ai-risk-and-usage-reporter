// Mock Entra ID and Sign-In logs generator

export function generateMockData() {
  // Define standard and AI applications
  const apps = [
    // Standard Apps (No AI)
    {
      DisplayName: 'Microsoft Teams',
      AppId: '00000002-0000-0ff1-ce00-000000000000',
      Permissions: 'User.Read, Directory.Read.All, Group.Read.All',
      Publisher: 'Microsoft Corporation'
    },
    {
      DisplayName: 'Salesforce CRM Integration',
      AppId: 'c186832e-436c-4861-a5bf-86a02df200a1',
      Permissions: 'User.Read, Contacts.Read, Calendars.Read',
      Publisher: 'Salesforce Inc'
    },
    {
      DisplayName: 'Zoom Video Communications',
      AppId: '940bb2ad-e4ba-4be7-a9a7-96a8be440623',
      Permissions: 'User.Read, Calendars.ReadWrite',
      Publisher: 'Zoom Video Communications'
    },
    {
      DisplayName: 'Slack Enterprise Suite',
      AppId: '3e46c76e-3467-4f67-be31-397c83fcd09a',
      Permissions: 'User.Read, Files.Read.All',
      Publisher: 'Slack Technologies'
    },
    {
      DisplayName: 'ServiceNow ITSM',
      AppId: 'fa17ca21-0a3c-4122-b5e1-9238bc3a5b67',
      Permissions: 'User.Read, Directory.Read.All',
      Publisher: 'ServiceNow Inc'
    },
    {
      DisplayName: 'Workday HR Platform',
      AppId: '9de7613b-aa78-4bb1-a8d2-43fbac70fa01',
      Permissions: 'User.Read, User.ReadWrite.All',
      Publisher: 'Workday'
    },

    // AI Applications
    {
      DisplayName: 'OpenAI ChatGPT Enterprise',
      AppId: '6438f61a-2258-4521-ba31-893dca9fbe1e',
      Permissions: 'User.Read, Files.ReadWrite.All, Mail.ReadWrite, Calendars.ReadWrite',
      Publisher: 'OpenAI Inc.'
    },
    {
      DisplayName: 'GitHub Copilot for Business',
      AppId: '148f43ad-2ba8-4c91-9e23-289cfaf2308a',
      Permissions: 'User.Read, Files.Read.All',
      Publisher: 'GitHub Inc.'
    },
    {
      DisplayName: 'Claude.ai Team Workspace',
      AppId: 'fae8913b-18a8-4444-a901-7fa8623b30ad',
      Permissions: 'User.Read, Directory.Read.All, Files.Read.All',
      Publisher: 'Anthropic PBC'
    },
    {
      DisplayName: 'Midjourney Discord Bot',
      AppId: '7776f3ab-7ba3-4c90-951a-8e2b83c749ab',
      Permissions: 'User.Read',
      Publisher: 'Midjourney Inc.'
    },
    {
      DisplayName: 'Perplexity Research Assistant',
      AppId: 'ab98fcfc-12bc-4488-8422-c32f83db56c0',
      Permissions: 'User.Read',
      Publisher: 'Perplexity AI'
    },
    {
      DisplayName: 'v0.dev Frontend Assistant',
      AppId: 'df4230ba-47bc-4999-a931-15cfcb3a59a9',
      Permissions: 'User.Read, Files.ReadWrite.All',
      Publisher: 'Vercel Inc.'
    },
    {
      DisplayName: 'Synthesia Video Creator',
      AppId: 'bc789212-00c1-4b11-a678-de31fb4011ea',
      Permissions: 'User.Read',
      Publisher: 'Synthesia Ltd'
    },
    {
      DisplayName: 'Custom Shadow-GPT Connector',
      AppId: 'ca77bc9a-7b3c-43d1-9bc1-12f7a93cbaef',
      Permissions: 'User.Read, Directory.ReadWrite.All, AppRoleAssignment.ReadWrite.All',
      Publisher: 'Unknown / Rogue Dev'
    }
  ];

  // Define mock users across departments
  const users = [
    { email: 'alice.smith@enterprise.com', dept: 'Engineering' },
    { email: 'bob.jones@enterprise.com', dept: 'Engineering' },
    { email: 'charlie.brown@enterprise.com', dept: 'Engineering' },
    { email: 'dave.miller@enterprise.com', dept: 'Engineering' },
    { email: 'eva.green@enterprise.com', dept: 'Engineering' },
    
    { email: 'diana.ross@enterprise.com', dept: 'Marketing' },
    { email: 'ethan.hunt@enterprise.com', dept: 'Marketing' },
    { email: 'fiona.gallagher@enterprise.com', dept: 'Marketing' },
    
    { email: 'george.clooney@enterprise.com', dept: 'HR' },
    { email: 'helen@enterprise.com', dept: 'HR' },
    
    { email: 'ian.mckellen@enterprise.com', dept: 'Finance' },
    { email: 'julia.roberts@enterprise.com', dept: 'Finance' },
    
    { email: 'karen.exec@enterprise.com', dept: 'Executive' },
    { email: 'leo.dicaprio@enterprise.com', dept: 'Executive' }
  ];

  const signIns = [];
  const now = new Date();

  // Create sign-in history for the past 14 days
  for (let day = 0; day < 14; day++) {
    const date = new Date(now);
    date.setDate(now.getDate() - day);
    const dateString = date.toISOString().split('T')[0];

    // Generate random sign-ins for this day
    const signInsCount = Math.floor(Math.random() * 20) + 15; // 15-35 sign ins per day
    for (let j = 0; j < signInsCount; j++) {
      // Pick a random application
      const app = apps[Math.floor(Math.random() * apps.length)];
      
      // Pick a random user (bias: engineering uses GitHub Copilot and ChatGPT more, marketing uses Claude and Midjourney, etc.)
      let user = users[Math.floor(Math.random() * users.length)];
      
      if (app.DisplayName.includes('GitHub Copilot')) {
        // Bias Copilot to Engineering
        const engUsers = users.filter(u => u.dept === 'Engineering');
        user = engUsers[Math.floor(Math.random() * engUsers.length)];
      } else if (app.DisplayName.includes('Midjourney') || app.DisplayName.includes('Synthesia')) {
        // Bias creatives to Marketing
        const mktUsers = users.filter(u => u.dept === 'Marketing');
        user = mktUsers[Math.floor(Math.random() * mktUsers.length)];
      }

      // Generate sign in time
      const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
      const minute = Math.floor(Math.random() * 60);
      const timestamp = `${dateString}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00Z`;

      signIns.push({
        AppDisplayName: app.DisplayName,
        AppId: app.AppId,
        UserPrincipalName: user.email,
        Department: user.dept,
        Timestamp: timestamp,
        CreatedDateTime: timestamp // Support both headers
      });
    }
  }

  return { apps, signIns };
}
