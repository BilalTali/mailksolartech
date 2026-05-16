import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { publicApi, type PublicSettingsData } from '@/services/public.api';

/** Resolve a storage path to a full URL. */
const getFileUrl = (path: string | null | undefined, fallback: string) => {
    if (!path) return fallback;
    if (path.startsWith('http')) return path;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').split('/api/v1')[0];
    return `${baseUrl}/storage/${path}`;
};

interface BreadcrumbItem {
    name: string;
    url: string;
}

interface SEOHeadProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    /** Extra JSON-LD schema objects to inject alongside the base Organization schema. */
    schemas?: Record<string, unknown>[];
    /** Breadcrumb trail for this page. If omitted, no BreadcrumbList schema is added. */
    breadcrumbs?: BreadcrumbItem[];
}

const SEOHead: React.FC<SEOHeadProps> = ({
    title = 'PM Surya Ghar Muft Bijli Yojana - Free Solar Subsidy & Registration',
    description = 'Apply for PM Surya Ghar Muft Bijli Yojana. Get up to ₹94,800 subsidy and 300 units of free electricity per month. Free registration and expert guidance.',
    keywords = 'PM Surya Ghar, PM Surya Ghar Yojana, Solar Subsidy India, Rooftop Solar, Muft Bijli Yojana, Solar Installation, Free Electricity',
    image = '/logo.webp',
    schemas = [],
    breadcrumbs,
}) => {
    const location = useLocation();
    const { data: settings } = useQuery<PublicSettingsData>({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
        staleTime: 1000 * 60 * 5,
    });

    const faviconUrl = getFileUrl(settings?.company_favicon, '/favicon.svg');
    const companyName = settings?.company_name || 'AndleebSurya';
    const siteTitle = title.includes(companyName) ? title : `${title} | ${companyName}`;
    const canonicalUrl = window.location.origin + location.pathname;
    const logoUrl = getFileUrl(settings?.company_logo, `${window.location.origin}/logo.webp`);
    const phone = settings?.company_mobile || '';
    const address = settings?.company_address || 'India';
    const email = settings?.company_email || '';
    const ogImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;

    /** Organization schema — always present on every page */
    const organizationSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: companyName,
        url: window.location.origin,
        logo: logoUrl,
        description,
        ...(phone ? { telephone: phone } : {}),
        ...(email ? { email } : {}),
        address: {
            '@type': 'PostalAddress',
            addressLocality: address,
            addressCountry: 'IN',
            streetAddress: address,
        },
        sameAs: [
            settings?.social_facebook || 'https://facebook.com/suryamitra',
            settings?.social_twitter || 'https://twitter.com/suryamitra',
        ].filter(Boolean),
    };

    /** LocalBusiness schema — searchable on Google Maps / local search */
    const localBusinessSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: companyName,
        image: logoUrl,
        url: window.location.origin,
        ...(phone ? { telephone: phone } : {}),
        ...(email ? { email } : {}),
        address: {
            '@type': 'PostalAddress',
            addressLocality: address,
            addressCountry: 'IN',
            streetAddress: address,
        },
        priceRange: 'Free',
        description: 'Official facilitator for PM Surya Ghar Muft Bijli Yojana — free registration, guidance, and solar installation support.',
    };

    /** BreadcrumbList schema (only if breadcrumbs are provided) */
    const breadcrumbSchema: Record<string, unknown> | null = breadcrumbs && breadcrumbs.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((crumb, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: crumb.name,
                item: crumb.url,
            })),
        }
        : null;

    const allSchemas: Record<string, unknown>[] = [
        organizationSchema,
        localBusinessSchema,
        ...(breadcrumbSchema ? [breadcrumbSchema] : []),
        ...schemas,
    ];

    return (
        <Helmet>
            <title>{siteTitle}</title>
            <link rel="icon" href={faviconUrl} />
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Preconnects for performance */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://www.googletagmanager.com" />

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content={companyName} />
            <meta property="og:locale" content="en_IN" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={canonicalUrl} />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Canonical */}
            <link rel="canonical" href={canonicalUrl} />

            {/* All JSON-LD schemas injected individually */}
            {allSchemas.map((schema, i) => (
                <script key={i} type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            ))}
        </Helmet>
    );
};

export default SEOHead;
