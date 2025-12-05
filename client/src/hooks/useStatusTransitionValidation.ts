import { useStatusTransitions } from "./useTaskStatuses";



export function useStatusTransitionValidation() {

  const { transitions } = useStatusTransitions();

  console.log("🔍 useStatusTransitionValidation → transitions:", transitions);



  // Convert both DB and incoming statuses to lowercase for safe comparison

  const normalize = (status: string) => status?.trim().toLowerCase();



  // Get allowed next statuses for a given current status

  const getAllowedNextStatuses = (currentStatus: string): string[] => {

    console.log("🟢 saksham  Checking allowed next statuses for:", currentStatus);

    const normalizedCurrent = normalize(currentStatus);



    const matches = transitions.filter(

      (t) => normalize(t.from_status) === normalizedCurrent

    );



    console.log("🧩 Found matches:", matches);



    return matches.map((t) => t.to_status);

  };



  // Check if a status transition is valid (case-insensitive)

  const isTransitionAllowed = (fromStatus: string, toStatus: string): boolean => {

    const from = normalize(fromStatus);

    const to = normalize(toStatus);



    return transitions.some(

      (t) =>

        normalize(t.from_status) === from &&

        normalize(t.to_status) === to

    );

  };



  // Get the sequence of statuses based on transitions (for forward-only workflow)

  const getStatusSequence = (): string[] => {

    const statusOrder: string[] = [];

    const visited = new Set<string>();



    const allToStatuses = new Set(transitions.map((t) => normalize(t.to_status)));

    const allFromStatuses = new Set(transitions.map((t) => normalize(t.from_status)));



    const startingStatuses = [...allFromStatuses].filter(

      (status) => !allToStatuses.has(status)

    );



    if (startingStatuses.length === 0 && transitions.length > 0) {

      statusOrder.push(normalize(transitions[0].from_status));

      visited.add(normalize(transitions[0].from_status));

    } else if (startingStatuses.length > 0) {

      statusOrder.push(startingStatuses[0]);

      visited.add(startingStatuses[0]);

    }



    let currentStatus = statusOrder[0];

    while (currentStatus) {

      const nextTransition = transitions.find(

        (t) =>

          normalize(t.from_status) === currentStatus &&

          !visited.has(normalize(t.to_status))

      );



      if (nextTransition) {

        statusOrder.push(normalize(nextTransition.to_status));

        visited.add(normalize(nextTransition.to_status));

        currentStatus = normalize(nextTransition.to_status);

      } else {

        break;

      }

    }



    return statusOrder;

  };



  // Check if a status change would be moving backwards

  const isMovingBackwards = (fromStatus: string, toStatus: string): boolean => {

    const sequence = getStatusSequence();

    const fromIndex = sequence.indexOf(normalize(fromStatus));

    const toIndex = sequence.indexOf(normalize(toStatus));



    return fromIndex !== -1 && toIndex !== -1 && toIndex < fromIndex;

  };



  return {

    getAllowedNextStatuses,

    isTransitionAllowed,

    getStatusSequence,

    isMovingBackwards,

    transitions,

  };

}

