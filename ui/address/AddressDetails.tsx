import { Box, Flex, Text, Icon, Button, Grid } from '@chakra-ui/react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import React from 'react';

import type { Address as TAddress, AddressCounters, AddressTokenBalance } from 'types/api/address';
import { QueryKeys } from 'types/client/queries';

import appConfig from 'configs/app/config';
import metamaskIcon from 'icons/metamask.svg';
import qrCodeIcon from 'icons/qr_code.svg';
import starOutlineIcon from 'icons/star_outline.svg';
import walletIcon from 'icons/wallet.svg';
import useFetch from 'lib/hooks/useFetch';
import useIsMobile from 'lib/hooks/useIsMobile';
import AddressIcon from 'ui/shared/address/AddressIcon';
import CopyToClipboard from 'ui/shared/CopyToClipboard';
import DataFetchAlert from 'ui/shared/DataFetchAlert';
import DetailsInfoItem from 'ui/shared/DetailsInfoItem';
import ExternalLink from 'ui/shared/ExternalLink';
import HashStringShorten from 'ui/shared/HashStringShorten';

import AddressDetailsSkeleton from './details/AddressDetailsSkeleton';
import TokenSelectDesktop from './tokenSelect/TokenSelectDesktop';
import TokenSelectMobile from './tokenSelect/TokenSelectMobile';

interface Props {
  addressQuery: UseQueryResult<TAddress>;
}

const AddressDetails = ({ addressQuery }: Props) => {
  const router = useRouter();
  const fetch = useFetch();
  const isMobile = useIsMobile();

  const countersQuery = useQuery<unknown, unknown, AddressCounters>(
    [ QueryKeys.addressCounters, router.query.id ],
    async() => await fetch(`/node-api/addresses/${ router.query.id }/counters`),
    {
      enabled: Boolean(router.query.id) && Boolean(addressQuery.data),
    },
  );

  const tokenBalancesQuery = useQuery<unknown, unknown, Array<AddressTokenBalance>>(
    [ QueryKeys.addressTokenBalances, router.query.id ],
    async() => await fetch(`/node-api/addresses/${ router.query.id }/token-balances`),
    {
      enabled: Boolean(router.query.id) && Boolean(addressQuery.data),
    },
  );

  if (countersQuery.isLoading || addressQuery.isLoading || tokenBalancesQuery.isLoading) {
    return <AddressDetailsSkeleton/>;
  }

  if (countersQuery.isError || addressQuery.isError || tokenBalancesQuery.isError) {
    return <DataFetchAlert/>;
  }

  const explorers = appConfig.network.explorers.filter(({ paths }) => paths.address);
  const validationsCount = Number(countersQuery.data.validations_count);

  return (
    <Box>
      <Flex alignItems="center">
        <AddressIcon hash={ addressQuery.data.hash }/>
        <Text ml={ 2 } fontFamily="heading" fontWeight={ 500 }>
          { isMobile ? <HashStringShorten hash={ addressQuery.data.hash }/> : addressQuery.data.hash }
        </Text>
        <CopyToClipboard text={ addressQuery.data.hash }/>
        <Icon as={ metamaskIcon } boxSize={ 6 } ml={ 2 }/>
        <Button variant="outline" size="sm" ml={ 3 }>
          <Icon as={ starOutlineIcon } boxSize={ 5 }/>
        </Button>
        <Button variant="outline" size="sm" ml={ 2 }>
          <Icon as={ qrCodeIcon } boxSize={ 5 }/>
        </Button>
      </Flex>
      { explorers.length > 0 && (
        <Flex mt={ 8 } columnGap={ 4 } flexWrap="wrap">
          <Text>Verify with other explorers</Text>
          { explorers.map((explorer) => {
            const url = new URL(explorer.paths.tx + '/' + router.query.id, explorer.baseUrl);
            return <ExternalLink key={ explorer.baseUrl } title={ explorer.title } href={ url.toString() }/>;
          }) }
        </Flex>
      ) }
      <Grid
        mt={ 8 }
        columnGap={ 8 }
        rowGap={{ base: 3, lg: 3 }}
        templateColumns={{ base: 'minmax(0, 1fr)', lg: 'auto minmax(0, 1fr)' }} overflow="hidden"
      >
        <DetailsInfoItem
          title="Tokens"
          hint="All tokens in the account and total value."
          alignSelf="center"
          py="2px"
        >
          { tokenBalancesQuery.data.length > 0 ? (
            <>
              { isMobile ? <TokenSelectMobile data={ tokenBalancesQuery.data }/> : <TokenSelectDesktop data={ tokenBalancesQuery.data }/> }
              <Button variant="outline" size="sm" ml={ 3 }>
                <Icon as={ walletIcon } boxSize={ 5 }/>
              </Button>
            </>
          ) : (
            '-'
          ) }
        </DetailsInfoItem>
        <DetailsInfoItem
          title="Transactions"
          hint="Number of transactions related to this address."
        >
          { Number(countersQuery.data.transactions_count).toLocaleString() }
        </DetailsInfoItem>
        <DetailsInfoItem
          title="Transfers"
          hint="Number of transfers to/from this address."
        >
          { Number(countersQuery.data.token_transfers_count).toLocaleString() }
        </DetailsInfoItem>
        <DetailsInfoItem
          title="Gas used"
          hint="Gas used by the address."
        >
          { BigNumber(countersQuery.data.gas_usage_count).toFormat() }
        </DetailsInfoItem>
        { !Object.is(validationsCount, NaN) && validationsCount > 0 && (
          <DetailsInfoItem
            title="Blocks validated"
            hint="Number of blocks validated by this validator."
          >
            { validationsCount.toLocaleString() }
          </DetailsInfoItem>
        ) }
      </Grid>
    </Box>
  );
};

export default React.memo(AddressDetails);
