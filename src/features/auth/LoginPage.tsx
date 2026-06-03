import { buildAuthorizeUrl } from '../../auth/oauth';

export default function LoginPage() {
  return <a href={buildAuthorizeUrl()}>Войти через Shikimori</a>;
}
