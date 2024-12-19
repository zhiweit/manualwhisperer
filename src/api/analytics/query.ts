import { SolidQueryOptions } from "@tanstack/solid-query";
import {
  getAverageResolutionTime,
  getErrorCountOverTime,
  getMachinesWithMostErrors,
  getMostCommonErrors,
  getMostCommonQuestions,
  getUsersWithMostQuestions,
} from "./rpc";

export const mostCommonErrorsQueryOpts = () =>
  ({
    queryKey: ["analytics", "errors", "common"],
    queryFn: () => getMostCommonErrors(),
  }) satisfies SolidQueryOptions;

export const machinesWithMostErrorsQueryOpts = () =>
  ({
    queryKey: ["analytics", "machines", "errors"],
    queryFn: () => getMachinesWithMostErrors(),
  }) satisfies SolidQueryOptions;

export const errorCountOverTimeQueryOpts = (
  timeframe: "day" | "week" | "month" = "day"
) =>
  ({
    queryKey: ["analytics", "errors", "trend", timeframe],
    queryFn: () => getErrorCountOverTime(timeframe),
  }) satisfies SolidQueryOptions;

export const usersWithMostQuestionsQueryOpts = () =>
  ({
    queryKey: ["analytics", "users", "questions"],
    queryFn: () => getUsersWithMostQuestions(),
  }) satisfies SolidQueryOptions;

export const mostCommonQuestionsQueryOpts = () =>
  ({
    queryKey: ["analytics", "questions", "common"],
    queryFn: () => getMostCommonQuestions(),
  }) satisfies SolidQueryOptions;

export const averageResolutionTimeQueryOpts = () =>
  ({
    queryKey: ["analytics", "resolution", "time"],
    queryFn: () => getAverageResolutionTime(),
  }) satisfies SolidQueryOptions;
