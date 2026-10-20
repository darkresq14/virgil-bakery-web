'use client';
import { Highlight, themes } from 'prism-react-renderer';
import type React from 'react';
import { CopyButton } from './CopyButton';

type Props = {
  code: string;
  language?: string;
};

export const Code: React.FC<Props> = ({ code, language = '' }) => {
  if (!code) return null;

  return (
    <Highlight code={code} language={language} theme={themes.vsDark}>
      {({ getLineProps, getTokenProps, tokens }) => (
        <pre className="bg-black p-4 border text-xs border-border rounded overflow-x-auto">
          {tokens.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: prism token stream has no stable identity; list is static per render
            <div key={i} {...getLineProps({ className: 'table-row', line })}>
              <span className="table-cell select-none text-right text-white/25">{i + 1}</span>
              <span className="table-cell pl-4">
                {line.map((token, key) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: prism tokens have no stable identity; list is static per render
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </span>
            </div>
          ))}
          <CopyButton code={code} />
        </pre>
      )}
    </Highlight>
  );
};
