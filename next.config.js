/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "Permissions-Policy",
                        value: "camera=(self), microphone=(self), display-capture=(self)",
                    },
                ],
            },
        ];
    },
    images: {
        remotePatterns:[
            {
                protocol: "https",
                hostname: "utfs.io"
            }
        ]
    }
};

export default config;
