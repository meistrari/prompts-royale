<template>
    <div max-w-1560px mx-auto p-2 py-5>
        <div grid grid-cols-12 gap-2>
            <div col-span-4>
                <AppInputArea />
            </div>

            <div col-span-4>
                <AppCandidateList />
            </div>

            <div col-span-4 flex="~ col" gap-3>
                <AppBattleList />
            </div>
        </div>
        <div mt-4>
            <ClientOnly>
                <EloChart />
                <template #placeholder>
                    <USkeleton w-full h-40dvh />
                </template>
            </ClientOnly>
        </div>
    </div>
</template>
