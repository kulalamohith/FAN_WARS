import fs from 'fs';
import path from 'path';

const rawData = `
Match 1 | 28 Mar 2026 | Saturday | RCB vs SRH | 7:30 PM | M Chinnaswamy Stadium, Bengaluru
Match 2 | 29 Mar 2026 | Sunday | MI vs KKR | 7:30 PM | Wankhede Stadium, Mumbai
Match 3 | 30 Mar 2026 | Monday | RR vs CSK | 7:30 PM | Sawai Mansingh Stadium, Jaipur
Match 4 | 31 Mar 2026 | Tuesday | PBKS vs GT | 7:30 PM | PCA Stadium, Mohali
Match 5 | 01 Apr 2026 | Wednesday | LSG vs DC | 7:30 PM | Ekana Stadium, Lucknow
Match 6 | 02 Apr 2026 | Thursday | KKR vs SRH | 7:30 PM | Eden Gardens, Kolkata
Match 7 | 03 Apr 2026 | Friday | CSK vs PBKS | 7:30 PM | MA Chidambaram Stadium, Chennai

Match 8 | 04 Apr 2026 | Saturday | DC vs MI | 3:30 PM | Arun Jaitley Stadium, Delhi
Match 9 | 04 Apr 2026 | Saturday | GT vs RR | 7:30 PM | Narendra Modi Stadium, Ahmedabad

Match 10 | 05 Apr 2026 | Sunday | SRH vs LSG | 3:30 PM | Rajiv Gandhi Stadium, Hyderabad
Match 11 | 05 Apr 2026 | Sunday | RCB vs CSK | 7:30 PM | M Chinnaswamy Stadium, Bengaluru

Match 12 | 06 Apr 2026 | Monday | KKR vs PBKS | 7:30 PM | Eden Gardens, Kolkata
Match 13 | 07 Apr 2026 | Tuesday | RR vs MI | 7:30 PM | Sawai Mansingh Stadium, Jaipur
Match 14 | 08 Apr 2026 | Wednesday | DC vs GT | 7:30 PM | Arun Jaitley Stadium, Delhi
Match 15 | 09 Apr 2026 | Thursday | KKR vs LSG | 7:30 PM | Eden Gardens, Kolkata
Match 16 | 10 Apr 2026 | Friday | RR vs RCB | 7:30 PM | Sawai Mansingh Stadium, Jaipur

Match 17 | 11 Apr 2026 | Saturday | PBKS vs SRH | 3:30 PM | PCA Stadium, Mohali
Match 18 | 11 Apr 2026 | Saturday | CSK vs DC | 7:30 PM | MA Chidambaram Stadium, Chennai

Match 19 | 12 Apr 2026 | Sunday | LSG vs GT | 3:30 PM | Ekana Stadium, Lucknow
Match 20 | 12 Apr 2026 | Sunday | MI vs RCB | 7:30 PM | Wankhede Stadium, Mumbai

Match 21 | 13 Apr 2026 | Monday | SRH vs RR | 7:30 PM | Rajiv Gandhi Stadium, Hyderabad
Match 22 | 14 Apr 2026 | Tuesday | CSK vs KKR | 7:30 PM | MA Chidambaram Stadium, Chennai
Match 23 | 15 Apr 2026 | Wednesday | RCB vs LSG | 7:30 PM | M Chinnaswamy Stadium, Bengaluru
Match 24 | 16 Apr 2026 | Thursday | MI vs PBKS | 7:30 PM | Wankhede Stadium, Mumbai
Match 25 | 17 Apr 2026 | Friday | GT vs KKR | 7:30 PM | Narendra Modi Stadium, Ahmedabad

Match 26 | 18 Apr 2026 | Saturday | RCB vs DC | 3:30 PM | M Chinnaswamy Stadium, Bengaluru
Match 27 | 18 Apr 2026 | Saturday | SRH vs CSK | 7:30 PM | Rajiv Gandhi Stadium, Hyderabad

Match 28 | 19 Apr 2026 | Sunday | KKR vs RR | 3:30 PM | Eden Gardens, Kolkata
Match 29 | 19 Apr 2026 | Sunday | PBKS vs LSG | 7:30 PM | PCA Stadium, Mohali

Match 30 | 20 Apr 2026 | Monday | GT vs MI | 7:30 PM | Narendra Modi Stadium, Ahmedabad
Match 31 | 21 Apr 2026 | Tuesday | SRH vs DC | 7:30 PM | Rajiv Gandhi Stadium, Hyderabad
Match 32 | 22 Apr 2026 | Wednesday | LSG vs RR | 7:30 PM | Ekana Stadium, Lucknow
Match 33 | 23 Apr 2026 | Thursday | MI vs CSK | 7:30 PM | Wankhede Stadium, Mumbai
Match 34 | 24 Apr 2026 | Friday | RCB vs GT | 7:30 PM | M Chinnaswamy Stadium, Bengaluru

Match 35 | 25 Apr 2026 | Saturday | DC vs PBKS | 3:30 PM | Arun Jaitley Stadium, Delhi
Match 36 | 25 Apr 2026 | Saturday | RR vs SRH | 7:30 PM | Sawai Mansingh Stadium, Jaipur

Match 37 | 26 Apr 2026 | Sunday | GT vs CSK | 3:30 PM | Narendra Modi Stadium, Ahmedabad
Match 38 | 26 Apr 2026 | Sunday | LSG vs KKR | 7:30 PM | Ekana Stadium, Lucknow

Match 39 | 27 Apr 2026 | Monday | DC vs RCB | 7:30 PM | Arun Jaitley Stadium, Delhi
Match 40 | 28 Apr 2026 | Tuesday | PBKS vs RR | 7:30 PM | PCA Stadium, Mohali
Match 41 | 29 Apr 2026 | Wednesday | MI vs SRH | 7:30 PM | Wankhede Stadium, Mumbai
Match 42 | 30 Apr 2026 | Thursday | GT vs RCB | 7:30 PM | Narendra Modi Stadium, Ahmedabad

Match 43 | 01 May 2026 | Friday | RR vs DC | 7:30 PM | Sawai Mansingh Stadium, Jaipur
Match 44 | 02 May 2026 | Saturday | CSK vs MI | 7:30 PM | MA Chidambaram Stadium, Chennai

Match 45 | 03 May 2026 | Sunday | SRH vs KKR | 3:30 PM | Rajiv Gandhi Stadium, Hyderabad
Match 46 | 03 May 2026 | Sunday | GT vs PBKS | 7:30 PM | Narendra Modi Stadium, Ahmedabad

Match 47 | 04 May 2026 | Monday | MI vs LSG | 7:30 PM | Wankhede Stadium, Mumbai
Match 48 | 05 May 2026 | Tuesday | DC vs CSK | 7:30 PM | Arun Jaitley Stadium, Delhi
Match 49 | 06 May 2026 | Wednesday | SRH vs PBKS | 7:30 PM | Rajiv Gandhi Stadium, Hyderabad
Match 50 | 07 May 2026 | Thursday | LSG vs RCB | 7:30 PM | Ekana Stadium, Lucknow

Match 51 | 08 May 2026 | Friday | DC vs KKR | 7:30 PM | Arun Jaitley Stadium, Delhi
Match 52 | 09 May 2026 | Saturday | RR vs GT | 7:30 PM | Sawai Mansingh Stadium, Jaipur

Match 53 | 10 May 2026 | Sunday | CSK vs LSG | 3:30 PM | MA Chidambaram Stadium, Chennai
Match 54 | 10 May 2026 | Sunday | RCB vs MI | 7:30 PM | M Chinnaswamy Stadium, Bengaluru

Match 55 | 11 May 2026 | Monday | PBKS vs DC | 7:30 PM | PCA Stadium, Mohali
Match 56 | 12 May 2026 | Tuesday | GT vs SRH | 7:30 PM | Narendra Modi Stadium, Ahmedabad
Match 57 | 13 May 2026 | Wednesday | RCB vs KKR | 7:30 PM | M Chinnaswamy Stadium, Bengaluru
Match 58 | 14 May 2026 | Thursday | PBKS vs MI | 7:30 PM | PCA Stadium, Mohali
Match 59 | 15 May 2026 | Friday | LSG vs CSK | 7:30 PM | Ekana Stadium, Lucknow

Match 60 | 16 May 2026 | Saturday | KKR vs GT | 7:30 PM | Eden Gardens, Kolkata

Match 61 | 17 May 2026 | Sunday | PBKS vs RCB | 3:30 PM | PCA Stadium, Mohali
Match 62 | 17 May 2026 | Sunday | DC vs RR | 7:30 PM | Arun Jaitley Stadium, Delhi

Match 63 | 18 May 2026 | Monday | CSK vs SRH | 7:30 PM | MA Chidambaram Stadium, Chennai
Match 64 | 19 May 2026 | Tuesday | RR vs LSG | 7:30 PM | Sawai Mansingh Stadium, Jaipur
Match 65 | 20 May 2026 | Wednesday | KKR vs MI | 7:30 PM | Eden Gardens, Kolkata
Match 66 | 21 May 2026 | Thursday | CSK vs GT | 7:30 PM | MA Chidambaram Stadium, Chennai
Match 67 | 22 May 2026 | Friday | SRH vs RCB | 7:30 PM | Rajiv Gandhi Stadium, Hyderabad
Match 68 | 23 May 2026 | Saturday | LSG vs PBKS | 7:30 PM | Ekana Stadium, Lucknow

Match 69 | 24 May 2026 | Sunday | MI vs RR | 3:30 PM | Wankhede Stadium, Mumbai
Match 70 | 24 May 2026 | Sunday | KKR vs DC | 7:30 PM | Eden Gardens, Kolkata
`;

const lines = rawData.split('\\n').map(l => l.trim()).filter(l => l && l.includes('|'));

const matches = lines.map(line => {
  const parts = line.split('|').map(p => p.trim());
  const id = parseInt(parts[0].replace('Match ', ''));
  const dateStr = parts[1];
  const day = parts[2];
  const teams = parts[3].split('vs').map(t => t.trim());
  const homeTeam = teams[0];
  const awayTeam = teams[1];
  const timeStr = parts[4];
  const stadium = parts[5];
  
  // Create a proper datetime string that JS can parse safely
  // E.g. "28 Mar 2026 7:30 PM +05:30"
  return {
    id,
    dateStr,
    day,
    homeTeam,
    awayTeam,
    timeStr,
    stadium,
    datetime: \`\${dateStr} \${timeStr} GMT+0530\` // Fixed to IST
  };
});

const tsCode = \`export interface IPLMatch {
  id: number;
  dateStr: string;
  day: string;
  homeTeam: string;
  awayTeam: string;
  timeStr: string;
  stadium: string;
  datetime: string;
}

export const IPL_2026_SCHEDULE: IPLMatch[] = \${JSON.stringify(matches, null, 2)};
\`;

fs.writeFileSync(path.join(process.cwd(), 'apps', 'web', 'src', 'data', 'ipl2026.ts'), tsCode);
console.log("Successfully generated apps/web/src/data/ipl2026.ts");
