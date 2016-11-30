<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Social Engine Migration
 * @ingroup     UnaModules
 *
 * @{
 */

class BxSEMigAlertsResponse extends BxBaseModTextAlertsResponse
{
    public function __construct()
    {
        $this -> MODULE = 'bx_se_migration';
        parent::__construct();
    }

    public function response($oAlert)
    {
        if ('system' == $oAlert->sUnit && 'encrypt_password_after' == $oAlert->sAction)
            BxDolService::call($this->MODULE, 'encrypt_password', array($oAlert));

        parent::response($oAlert);
    }
}

/** @} */
