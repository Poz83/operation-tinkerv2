/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ColoringPage, PageStatus } from './types';

interface StatusBadgeProps {
  page: ColoringPage;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ page }) => {
  const statusConfig: Record<PageStatus, { bg: string; text: string; label: string }> = {
    queued: {
      bg: 'bg-zinc-700',
      text: 'text-zinc-300',
      label: 'Up next'
    },
    planning: {
      bg: 'bg-blue-500',
      text: 'text-white',
      label: 'Planning'
    },
    cooldown: {
      bg: 'bg-amber-500',
      text: 'text-white',
      label: page.cooldownRemaining ? `⏱ ${page.cooldownRemaining}s` : '⏱ Break'
    },
    generating: {
      bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
      text: 'text-white',
      label: 'Creating...'
    },
    qa_checking: {
      bg: 'bg-purple-500',
      text: 'text-white',
      label: 'Checking'
    },
    retrying: {
      bg: 'bg-orange-500',
      text: 'text-white',
      label: 'Fixing...'
    },
    complete: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
      text: 'text-white',
      label: '✓ Done'
    },
    error: {
      bg: 'bg-red-500',
      text: 'text-white',
      label: '⚠ Oops'
    }
  };

  const status = page.status || 'queued';
  const config = statusConfig[status];

  return (
    <div className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} transition-all duration-200`}>
      {config.label}
    </div>
  );
};
