import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook } from 'payload'

export const revalidateTestimonial: CollectionAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating homepage for testimonials`)

    revalidatePath('/')
    revalidateTag('global_homepage', 'max')
  }

  return doc
}
