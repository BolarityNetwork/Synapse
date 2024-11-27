import { jest, describe, test, afterEach } from "@jest/globals";

import { calculateSequenceStats } from "../../../relayer/middleware/missedVaasV3/helpers.js";

describe("MissedVaaV3.helpers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateSequenceStats", () => {
    function prepareTest(overrides?: any) {
      const runStats = {
        processed: [],
        seenSequences: [],
        failedToRecover: [],
        failedToReprocess: [],
        lookAheadSequences: [],
        missingSequences: [],
        ...(overrides?.runStats ?? {}),
      };

      const failedToFetchSequences = overrides?.failedToFetchSequences ?? [];

      const previousSafeSequence = overrides?.previousSafeSequence ?? undefined;

      return { runStats, failedToFetchSequences, previousSafeSequence };
    }

    test("lastSafeSequence: if there are missing sequences, lastSafeSequence is the last sequence sequence failed to fetch", () => {
      const failedToFetchSequenceMock = 100;
      const { runStats, failedToFetchSequences, previousSafeSequence } =
        prepareTest({
          failedToFetchSequences: [100],
        });

      const result = calculateSequenceStats(
        runStats,
        failedToFetchSequences,
        previousSafeSequence,
      );

      expect(result.lastSafeSequence).toEqual(failedToFetchSequenceMock - 1);
    });

    test("lastSafeSequence: if sequences failed to recover, lastSafeSequence is the last sequence before the missing sequence", () => {
      const missingSequenceMock = 100;
      const { runStats, failedToFetchSequences, previousSafeSequence } =
        prepareTest({
          runStats: {
            missingSequences: [missingSequenceMock],
            failedToRecover: [103],
          },
        });

      const result = calculateSequenceStats(
        runStats,
        failedToFetchSequences,
        previousSafeSequence,
      );

      expect(result.lastSafeSequence).toEqual(missingSequenceMock - 1);
    });

    test("lastSafeSequence: if sequences failed to re-process, lastSafeSequence is the last sequence before the missing sequence", () => {
      const missingSequenceMock = 100;
      const { runStats, failedToFetchSequences, previousSafeSequence } =
        prepareTest({
          runStats: {
            missingSequences: [missingSequenceMock],
            failedToReprocess: [103],
          },
        });

      const result = calculateSequenceStats(
        runStats,
        failedToFetchSequences,
        previousSafeSequence,
      );

      expect(result.lastSafeSequence).toEqual(missingSequenceMock - 1);
    });

    test("lastSafeSequence: if no sequence present failures (fetch, recover or reprocess) and lookahead found any vaa it's sequence will be used as the last safe sequence", () => {
      const greatestLookAheadSequence = 103;
      const { runStats, failedToFetchSequences, previousSafeSequence } =
        prepareTest({
          runStats: {
            lookAheadSequences: [101, 102, greatestLookAheadSequence],
          },
        });

      const result = calculateSequenceStats(
        runStats,
        failedToFetchSequences,
        previousSafeSequence,
      );

      expect(result.lastSafeSequence).toEqual(greatestLookAheadSequence);
    });

    test("lastSafeSequence: if no sequence present failures (fetch, recover or reprocess) and lookahead didnt find vaas but there are seen VAAs we'll use the greatest seen vaa sequence", () => {
      const greatestSeenSequence = 103;
      const { runStats, failedToFetchSequences, previousSafeSequence } =
        prepareTest({
          runStats: { seenSequences: [101, 102, greatestSeenSequence] },
        });

      const result = calculateSequenceStats(
        runStats,
        failedToFetchSequences,
        previousSafeSequence,
      );

      expect(result.lastSafeSequence).toEqual(greatestSeenSequence);
    });

    test("lastSafeSequence: if no sequence present failures (fetch, recover or reprocess) and lookahead didnt find vaas and there are no seen sequences, we'll use the previous safe sequence if there is one", () => {
      const safeSequenceMock = 105n;
      const { runStats, failedToFetchSequences, previousSafeSequence } =
        prepareTest({
          previousSafeSequence: safeSequenceMock,
        });

      const result = calculateSequenceStats(
        runStats,
        failedToFetchSequences,
        previousSafeSequence,
      );

      expect(result.lastSafeSequence).toEqual(
        Number(safeSequenceMock.toString()),
      );
    });

    test("lastSafeSequence: if no sequence present failures (fetch, recover or reprocess) and lookahead didnt find vaas and there are no seen sequences nor previous safe sequence, we'll set safe sequence to 0", () => {
      const { runStats, failedToFetchSequences, previousSafeSequence } =
        prepareTest();

      const result = calculateSequenceStats(
        runStats,
        failedToFetchSequences,
        previousSafeSequence,
      );

      expect(result.lastSafeSequence).toEqual(0);
    });
  });
});
