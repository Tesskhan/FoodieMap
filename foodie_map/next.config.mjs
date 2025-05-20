   /** @type {import('next').NextConfig} */
   const nextConfig = {
    async redirects() {
      return [
        {
          source: '/',
          destination: '/edit_reviewers', // Replace '/home' with the path to your desired page
          permanent: true,
        },
      ];
    },
  };

  export default nextConfig;