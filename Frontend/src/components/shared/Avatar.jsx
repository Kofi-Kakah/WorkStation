import { Box, Avatar as ChakraAvatar } from '@chakra-ui/react';

/**
 * User avatar with status ring.
 *
 * @param {{ name?: string, src?: string, size?: 'sm'|'md'|'lg'|'xl', status?: 'online'|'offline'|'away'|'busy', className?: string }} props
 */
export function Avatar({ name, src, size = 'md', status, className = '' }) {
  return (
    <Box position="relative" display="inline-block" className={className}>
      <ChakraAvatar
        size={size}
        name={name}
        src={src}
        bg="amethyst.200"
        color="amethyst.800"
        fontWeight="600"
      />
      {status && (
        <Box
          position="absolute"
          bottom={0}
          right={0}
          w={size === 'sm' ? '10px' : '12px'}
          h={size === 'sm' ? '10px' : '12px'}
          borderRadius="full"
          bg={status === 'online' ? 'green.400' : status === 'busy' ? 'red.400' : status === 'away' ? 'yellow.400' : 'gray.400'}
          border="2px solid"
          borderColor="white"
          _dark={{ borderColor: 'gray.800' }}
        />
      )}
    </Box>
  );
}

export default Avatar;