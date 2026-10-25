import type { Resource, ResourceOrdering } from '../types';

export interface PreventionSimulationResult {
  isAllowed: boolean;
  ruleName: 'HIERARCHICAL_ORDERING';
  requestedResource: Resource;
  heldResources: Resource[];
  highestHeldResource?: Resource;
  highestHeldRank: number;
  requestedRank: number;
  message: string;
  mathematicalProof: string;
  tradeOffAnalysis: {
    pros: string[];
    cons: string[];
  };
}

/**
 * Evaluates whether a process is permitted to request a given resource
 * under the Strict Hierarchical Resource Ordering Protocol (Havender's Method).
 */
export function evaluateResourceOrderingRequest(
  ordering: ResourceOrdering,
  allResources: Resource[],
  heldResourceIds: string[],
  requestedResourceId: string
): PreventionSimulationResult {
  const requestedRes = allResources.find((r) => r.id === requestedResourceId) || {
    id: requestedResourceId,
    name: requestedResourceId,
    totalInstances: 1,
  };

  const heldResources = allResources.filter((r) => heldResourceIds.includes(r.id));
  const requestedRank = ordering[requestedResourceId] ?? 0;

  let highestHeldRank = 0;
  let highestHeldRes: Resource | undefined = undefined;

  for (const held of heldResources) {
    const rank = ordering[held.id] ?? 0;
    if (rank > highestHeldRank) {
      highestHeldRank = rank;
      highestHeldRes = held;
    }
  }

  const proof = `Mathematical Proof against Circular Wait:
Let F: R -> N be the strictly monotonic numbering of resource types.
Assume a circular wait exists: P_0 holds R_0 and waits for R_1 held by P_1; ... P_k holds R_k and waits for R_0 held by P_0.
Under the ordering policy, a process can only request a resource of higher rank than any resource it currently holds.
Therefore: F(R_0) < F(R_1) < F(R_2) < ... < F(R_k) < F(R_0).
This implies F(R_0) < F(R_0), which is a logical contradiction.
Hence, the Circular Wait condition is mathematically impossible under this policy.`;

  const tradeOffAnalysis = {
    pros: [
      'Eliminates the Circular Wait condition completely without runtime graph cycle checks.',
      'Simple protocol to enforce during application compilation or system API calls.',
      'No need to know maximum claims in advance (unlike Banker’s avoidance algorithm).',
    ],
    cons: [
      'Reduces runtime flexibility: resources must be requested in an artificial predetermined sequence.',
      'Processes may hold low-order resources long before they are actually needed, reducing overall utilization.',
      'If a process needs a lower-ranked resource later, it must release all higher-ranked resources and re-acquire them.',
    ],
  };

  if (heldResources.length === 0 || requestedRank > highestHeldRank) {
    return {
      isAllowed: true,
      ruleName: 'HIERARCHICAL_ORDERING',
      requestedResource: requestedRes,
      heldResources,
      highestHeldResource: highestHeldRes,
      highestHeldRank,
      requestedRank,
      message: `REQUEST ALLOWED: Rank of requested resource ${requestedRes.name} (F=${requestedRank}) is strictly greater than the highest currently held resource ${highestHeldRes ? `${highestHeldRes.name} (F=${highestHeldRank})` : 'None (F=0)'}. Circular wait is preserved as impossible.`,
      mathematicalProof: proof,
      tradeOffAnalysis,
    };
  } else {
    return {
      isAllowed: false,
      ruleName: 'HIERARCHICAL_ORDERING',
      requestedResource: requestedRes,
      heldResources,
      highestHeldResource: highestHeldRes,
      highestHeldRank,
      requestedRank,
      message: `REQUEST REJECTED: Order violation! The process holds ${highestHeldRes?.name} (Rank F=${highestHeldRank}) and requested ${requestedRes.name} (Rank F=${requestedRank}). Since ${requestedRank} <= ${highestHeldRank}, granting this request could create a circular dependency. The process must release ${highestHeldRes?.name} first before requesting ${requestedRes.name}.`,
      mathematicalProof: proof,
      tradeOffAnalysis,
    };
  }
}
