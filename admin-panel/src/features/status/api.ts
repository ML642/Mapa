import { rawClient, unwrapData } from '../../shared/api/http';
import type { HealthStatus } from '../../shared/types';

export const fetchApiStatus = () => unwrapData<HealthStatus>(rawClient.get('/status'));
