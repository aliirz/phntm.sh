const PHNTM_QUOTES = [
  '%c"Why are we still here? Just to suffer?"',
  '%c"Kept you waiting, huh?"',
  '%c"Nothing is true, everything is permitted."',
  '%c"A phantom. That\'s what I am."',
  '%c"We pull in money, recruits... just to combat our inner demons."',
  '%c"I\'m already a demon."',
  '%c"The world calls for wetwork, and we answer."',
  '%c"There are no facts, only interpretations."',
  '%c"You\'re pretty good."',
  '%c"War has changed."',
  '%c"A strong man doesn\'t need to read the future. He makes his own."',
  '%c"We have no nation, no philosophy, no ideology."',
  '%c"It\'s not about changing the world. It\'s about doing our best to leave the world the way it is."',
  '%c"Now go! Let the legend come back to life!"',
  '%c"The chain of retaliation is what will truly kill this world."',
  '%c"Building the future and keeping the past alive are one and the same thing."',
  '%c"This is good... isn\'t it?"',
];

const DISCOVERY_MESSAGES = [
  [
    '%c╔══════════════════════════════════════════╗\n║  CONGRATULATIONS, YOU FOUND THE CONSOLE  ║\n║  You must be one of those curious types.  ║\n║  We like curious types.                  ║\n╚══════════════════════════════════════════╝',
    'color: #00ffd1; font-size: 13px; font-family: monospace;',
  ],
  [
    '%c> DIAMOND DOGS INTELLIGENCE UNIT\n> OPERATIVE DETECTED IN DEV TOOLS\n> CLEARANCE LEVEL: ████████\n> STATUS: WATCHING',
    'color: #ff6b6b; font-size: 12px; font-family: monospace; line-height: 1.6;',
  ],
  [
    '%c☠ OUTER HEAVEN NETWORK ☠\n  Your files are encrypted.\n  Your identity is a phantom.\n  Welcome to the abyss.',
    'color: #a78bfa; font-size: 12px; font-family: monospace; line-height: 1.6;',
  ],
];

const SUBTLE_MESSAGES = [
  ['%c[SIGINT] ...did you hear that?', 'color: #555; font-size: 10px;'],
  ['%c[CODEC] Snake? SNAKE? SNAAAAKE!', 'color: #666; font-size: 10px;'],
  ['%c[INTEL] They played us like a damn fiddle!', 'color: #555; font-size: 10px;'],
  ['%c[ALERT] ! ', 'color: #ff0; font-size: 14px; font-weight: bold;'],
  ['%c[TRANSMISSION] ...the La-Li-Lu-Le-Lo?', 'color: #555; font-size: 10px;'],
  ['%c[CODEC] Colonel, what\'s a Russian gunship doing here?', 'color: #555; font-size: 10px;'],
  ['%c[PHANTOM] V has come to.', 'color: #555; font-size: 10px;'],
  ['%c[INTEL] A surveillance camera?!', 'color: #555; font-size: 10px;'],
  ['%c[CODEC] I need scissors! 61!', 'color: #555; font-size: 10px;'],
  ['%c[SIGINT] You knew? ...you KNEW?!', 'color: #555; font-size: 10px;'],
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let subtleTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSubtleMessage() {
  if (subtleTimer) clearTimeout(subtleTimer);
  const delay = 30_000 + Math.random() * 90_000; // 30s - 2min
  subtleTimer = setTimeout(() => {
    const [msg, style] = pick(SUBTLE_MESSAGES);
    console.log(msg, style);
    scheduleSubtleMessage();
  }, delay);
}

export function initEasterEggs() {
  if (typeof window === 'undefined') return;

  // 1. Big discovery message on load
  const [discMsg, discStyle] = pick(DISCOVERY_MESSAGES);
  console.log(discMsg, discStyle);

  // 2. Random quote
  const quote = pick(PHNTM_QUOTES);
  console.log(
    quote,
    'color: #00ffd1; font-style: italic; font-size: 11px; padding: 4px 0;'
  );

  // 3. PHNTM branding
  console.log(
    '%c    ██████╗ ██╗  ██╗███╗   ██╗████████╗███╗   ███╗\n    ██╔══██╗██║  ██║████╗  ██║╚══██╔══╝████╗ ████║\n    ██████╔╝███████║██╔██╗ ██║   ██║   ██╔████╔██║\n    ██╔═══╝ ██╔══██║██║╚██╗██║   ██║   ██║╚██╔╝██║\n    ██║     ██║  ██║██║ ╚████║   ██║   ██║ ╚═╝ ██║\n    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝     ╚═╝',
    'color: #00ffd1; font-size: 10px;'
  );

  // 4. Schedule random subtle messages that appear over time
  scheduleSubtleMessage();

  // 5. Secret global function
  (window as unknown as Record<string, unknown>).__phantom = () => {
    console.log(
      '%c🎖 MISSION COMPLETE\n  S-Rank Achieved.\n  You are a true patriot.',
      'color: #ffd700; font-size: 14px; font-family: monospace; line-height: 1.6;'
    );
    console.log(
      '%c  "We\'re not tools of the government, or anyone else.\n   Fighting was the only thing I was good at.\n   But at least I always fought for what I believed in."',
      'color: #00ffd1; font-style: italic; font-size: 11px;'
    );
    return '// PHANTOM PROTOCOL ACTIVATED //';
  };
}
