const fs = require('fs');
const content = fs.readFileSync('frontend/App.tsx', 'utf8');

const debugCode = `
  const prevStates = React.useRef({});
  React.useEffect(() => {
    if (prevStates.current.currentUser !== currentUser) console.log("currentUser changed");
    if (prevStates.current.posts !== posts) console.log("posts changed");
    if (prevStates.current.currentPage !== currentPage) console.log("currentPage changed");
    if (prevStates.current.viewingUser !== viewingUser) console.log("viewingUser changed");
    if (prevStates.current.isLoading !== isLoading) console.log("isLoading changed");
    if (prevStates.current.notifications !== notifications) console.log("notifications changed");
    if (prevStates.current.dbStatus !== dbStatus) console.log("dbStatus changed");
    
    prevStates.current = { currentUser, posts, currentPage, viewingUser, isLoading, notifications, dbStatus };
  });
`;

// Insert the debug code after console.log("App component render function start");
const newContent = content.replace('console.log("App component render function start");', 'console.log("App component render function start");' + debugCode);

fs.writeFileSync('frontend/App.tsx', newContent);
