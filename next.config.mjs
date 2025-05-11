/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure images with allowed patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/**',
      },
    ],
  },
  // For CI environments, minimize webpack optimization to prevent issues
  webpack: (config, { isServer }) => {
    if (process.env.CI) {
      // Reduce optimization in CI environments
      config.optimization.minimize = false;

      // Skip PostCSS and Tailwind processing in CI
      if (process.env.SKIP_TAILWIND === 'true' || process.env.SKIP_POSTCSS === '1') {
        // Completely remove CSS handling in CI builds
        const rules = config.module.rules;
        
        // Find CSS rule and disable it
        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i];
          if (rule.test && rule.test.test && 
              (rule.test.test('file.css') || rule.test.test('file.scss') || rule.test.test('file.sass'))) {
            // Replace with a dummy rule that does nothing
            rules[i] = {
              test: rule.test,
              use: [
                {
                  loader: 'null-loader',
                },
              ],
            };
          }
        }

        // Ignore tailwind.config.ts file
        config.resolve.alias['tailwindcss'] = false;
      }
    }
    return config;
  },
};

export default nextConfig;
