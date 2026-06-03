import { jsx as _jsx } from "react/jsx-runtime";
import { buildAuthorizeUrl } from '../../auth/oauth';
export default function LoginPage() {
    return _jsx("a", { href: buildAuthorizeUrl(), children: "\u0412\u043E\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 Shikimori" });
}
