import { Component } from "solid-js";
import { Skeleton } from "~/components/ui/skeleton";

export const AlarmFormSkeleton: Component = () => {
  return (
    <div class="animate-pulse">
      <div class="flex flex-col md:flex-row gap-4 mt-4">
        {/* Alarm Code */}
        <div class="mb-4 flex-grow">
          <div class="block text-sm font-medium text-gray-300 mb-2">
            Alarm Code
          </div>
          <Skeleton height={40} width="100%" radius={4} />
        </div>

        {/* Alarm Message */}
        <div class="mb-4 flex-grow">
          <div class="block text-sm font-medium text-gray-300 mb-2">
            Alarm Message
          </div>
          <Skeleton height={40} width="100%" radius={4} />
        </div>

        {/* Machine Type */}
        <div class="mb-4 w-full md:w-48">
          <div class="block text-sm font-medium text-gray-300 mb-2">
            Machine Type
          </div>
          <Skeleton height={40} width="100%" radius={4} />
        </div>
      </div>

      {/* Alarm Description */}
      <div class="mb-4">
        <div class="block text-sm font-medium text-gray-300 mb-2">
          Alarm Description
        </div>
        <Skeleton height={80} width="100%" radius={4} />
      </div>

      <hr class="my-4" />

      {/* Solution */}
      <div class="mb-4">
        <div class="block text-sm font-medium text-gray-300 mb-2 mt-6">
          Solution
        </div>
        <Skeleton height={192} width="100%" radius={4} />
      </div>

      {/* Last Updated and Submit Button */}
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mt-4">
        <div class="text-sm text-gray-300 font-medium order-2 sm:order-1">
          Last Updated: <Skeleton height={16} width={160} radius={4} />
        </div>
        <Skeleton
          height={40}
          width={128}
          radius={4}
          class="order-1 sm:order-2"
        />
      </div>
    </div>
  );
};
