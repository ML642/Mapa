/**
 */
const getClientIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        const ips = typeof forwardedFor === 'string' ? forwardedFor.split(',') : forwardedFor;
        if (ips.length > 0) {
            const clientIp = ips[0].trim();
            if (clientIp) return cleanIp(clientIp);
        }
    }

    const headerIp = 
        req.headers['cf-connecting-ip'] || 
        req.headers['x-real-ip'] ||        
        req.headers['x-client-ip'];        

    if (headerIp && typeof headerIp === 'string') {
        return cleanIp(headerIp.trim());
    }

    const socketIp = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress;

    return socketIp ? cleanIp(socketIp) : '127.0.0.1';
};

/**
 */
const cleanIp = (ip) => {
    if (ip.startsWith('::ffff:')) {
        return ip.replace('::ffff:', '');
    }
    if (ip === '::1') {
        return '127.0.0.1';
    }
    return ip;
};

module.exports = getClientIp;
