import env from '../config/env.config.ts';

export const getUserAvatarUrl = (avatar: string | null | undefined) => {
  if (!avatar) {
    return '';
  }

  return `${env.server.uploadsUrl}/${env.server.uploadsUserDir}${avatar}`;
};
